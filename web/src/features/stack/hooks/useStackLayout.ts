import { useMemo } from 'react';

import type { LayerBlock, LayerId, LayerInstances, PaletteKey, StackLayout } from '../types';

/** 爆炸視圖每個槽位的最大間距 */
const EXPLODE_GAP = 0.9;

type Vec3 = [number, number, number];

function grid(cols: number, rows: number, w: number, d: number, y: number, cx = 0, cz = 0): Vec3[] {
  const out: Vec3[] = [];
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      out.push([
        cx + (cols === 1 ? 0 : -w / 2 + (w * i) / (cols - 1)),
        y,
        cz + (rows === 1 ? 0 : -d / 2 + (d * j) / (rows - 1)),
      ]);
    }
  }
  return out;
}

interface Options {
  explode: number;
  interposerVariant: string;
  substrateVariant: string;
}

/**
 * 依堆疊順序計算每個方塊的位置（厚度誇張化，非真實比例）。
 * 每個「槽位」在爆炸時往上位移 slot * explode * EXPLODE_GAP。
 */
export function useStackLayout({ explode, interposerVariant, substrateVariant }: Options): StackLayout {
  return useMemo(() => {
    const blocks: LayerBlock[] = [];
    const instances: LayerInstances[] = [];
    let y = 0;
    let slot = 0;
    const lift = () => slot * explode * EXPLODE_GAP;

    const addBlock = (
      key: string,
      layerId: LayerId,
      size: Vec3,
      palette: PaletteKey,
      offset: Vec3 = [0, 0, 0],
      opacity?: number,
    ) => {
      blocks.push({
        key,
        layerId,
        size,
        palette,
        opacity,
        position: [offset[0], y + size[1] / 2 + lift() + offset[1], offset[2]],
      });
    };

    // --- PCB：多層 CCL，側面看得到內層銅 ---
    const pcbT = 0.7;
    addBlock('pcb', 'server-pcb', [24, pcbT, 20], 'pcb');
    for (let i = 1; i < 6; i++) {
      blocks.push({
        key: `pcb-cu-${i}`,
        layerId: 'server-pcb',
        size: [24.04, 0.025, 20.04],
        palette: 'copper',
        position: [0, y + (pcbT * i) / 6, 0],
      });
    }
    y += pcbT;
    slot++;

    // --- BGA ---
    const bgaH = 0.5;
    instances.push({
      key: 'bga',
      layerId: 'bga',
      shape: 'sphere',
      radius: 0.28,
      height: bgaH,
      palette: 'solder',
      positions: grid(13, 13, 11, 11, y + bgaH / 2 + lift()),
    });
    y += bgaH;
    slot++;

    // --- ABF 載板：防焊 / 增層 / 核心 / 增層 / 防焊 ---
    const sub = 12;
    const glassCore = substrateVariant === 'glass-core';
    const subLayers: [string, LayerId, number, PaletteKey, number?][] = [
      ['mask-bot', 'solder-mask', 0.06, 'mask'],
      ['buildup-bot', 'substrate-buildup', 0.3, 'abf'],
      ['core', 'substrate-core', 0.45, glassCore ? 'glassCore' : 'core', glassCore ? 0.75 : undefined],
      ['buildup-top', 'substrate-buildup', 0.3, 'abf'],
      ['mask-top', 'solder-mask', 0.06, 'mask'],
    ];
    for (const [key, id, t, palette, opacity] of subLayers) {
      addBlock(key, id, [sub, t, sub], palette, undefined, opacity);
      y += t;
      slot++;
    }

    // --- C4 + underfill ---
    const ipW = 8;
    const ipD = 6;
    const c4H = 0.22;
    instances.push({
      key: 'c4',
      layerId: 'c4',
      shape: 'sphere',
      radius: 0.11,
      height: c4H,
      palette: 'solder',
      positions: grid(20, 15, ipW - 0.4, ipD - 0.4, y + c4H / 2 + lift()),
    });
    addBlock('underfill', 'c4', [ipW + 0.3, c4H, ipD + 0.3], 'underfill', undefined, 0.35);
    y += c4H;
    slot++;

    // --- 中介層（S / R / L） ---
    const ipT = 0.28;
    addBlock('interposer', 'interposer', [ipW, ipT, ipD], interposerVariant === 'cowos-s' ? 'silicon' : 'organicRdl');
    if (interposerVariant === 'cowos-l') {
      // LSI 局部矽橋：位於 GPU 與 GPU、GPU 與 HBM 交界下方
      const bridges: Vec3[] = [
        [0, 0, -0.9],
        [0, 0, 0.9],
        ...[-2.1, -0.7, 0.7, 2.1].flatMap<Vec3>((z) => [
          [-2.6, 0, z],
          [2.6, 0, z],
        ]),
      ];
      // 略高於中介層，讓矽橋上下表面露出、不與 RDL 面重疊閃爍
      bridges.forEach((p, i) =>
        addBlock(`lsi-${i}`, 'interposer', [0.7, ipT + 0.012, 0.45], 'silicon', [p[0], -0.006, p[2]]),
      );
    }
    y += ipT;
    slot++;

    // --- µBump ---
    const ubH = 0.1;
    const dieW = 2.4;
    const dieD = 3.4;
    const gpuX = [-1.3, 1.3];
    const hbmX = [-3.3, 3.3];
    const hbmZ = [-2.1, -0.7, 0.7, 2.1];
    const ubY = y + ubH / 2 + lift();
    instances.push({
      key: 'ubump',
      layerId: 'ubump',
      shape: 'cylinder',
      radius: 0.045,
      height: ubH,
      palette: 'copper',
      positions: [
        ...gpuX.flatMap((x) => grid(12, 16, dieW - 0.3, dieD - 0.3, ubY, x)),
        ...hbmX.flatMap((x) => hbmZ.flatMap((z) => grid(5, 5, 0.8, 0.9, ubY, x, z))),
      ],
    });
    y += ubH;
    slot++;

    // --- GPU 晶粒 + HBM 堆疊（同一槽位） ---
    const dieT = 0.45;
    gpuX.forEach((x, i) => addBlock(`gpu-${i}`, 'gpu', [dieW, dieT, dieD], 'die', [x, 0, 0]));
    const sliceT = 0.07;
    hbmX.forEach((x, i) =>
      hbmZ.forEach((z, j) => {
        for (let k = 0; k < 9; k++) {
          addBlock(`hbm-${i}-${j}-${k}`, 'hbm', [1.1, sliceT - 0.008, 1.2], k === 0 ? 'die' : 'hbm', [
            x,
            k * sliceT,
            z,
          ]);
        }
      }),
    );
    y += Math.max(dieT, 9 * sliceT);
    slot++;

    // --- 蓋板 ---
    y += 0.15;
    addBlock('lid', 'lid', [sub, 0.2, sub], 'lid', undefined, 0.28);

    const bounds = {} as StackLayout['bounds'];
    const extend = (id: LayerId, c: Vec3, s: Vec3) => {
      const prev = bounds[id];
      const min: Vec3 = [c[0] - s[0] / 2, c[1] - s[1] / 2, c[2] - s[2] / 2];
      const max: Vec3 = [c[0] + s[0] / 2, c[1] + s[1] / 2, c[2] + s[2] / 2];
      if (prev) {
        for (let a = 0; a < 3; a++) {
          min[a] = Math.min(min[a], prev.center[a] - prev.size[a] / 2);
          max[a] = Math.max(max[a], prev.center[a] + prev.size[a] / 2);
        }
      }
      bounds[id] = {
        center: [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2],
        size: [max[0] - min[0], max[1] - min[1], max[2] - min[2]],
      };
    };
    for (const b of blocks) {
      extend(b.layerId, b.position, b.size);
      if (b.layerId.startsWith('substrate-') || b.layerId === 'solder-mask') extend('substrate', b.position, b.size);
    }
    for (const inst of instances) {
      const xs = inst.positions.map((p) => p[0]);
      const zs = inst.positions.map((p) => p[2]);
      const cy = inst.positions[0][1];
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minZ = Math.min(...zs);
      const maxZ = Math.max(...zs);
      extend(inst.layerId, [(minX + maxX) / 2, cy, (minZ + maxZ) / 2], [maxX - minX, inst.height, maxZ - minZ]);
    }

    return { blocks, instances, bounds };
  }, [explode, interposerVariant, substrateVariant]);
}

/** 把父層（例如 substrate）展開成實際渲染的子層 id */
export function expandLayerIds(ids: string[]): Set<string> {
  const out = new Set(ids);
  if (out.has('substrate')) {
    out.add('substrate-core');
    out.add('substrate-buildup');
    out.add('solder-mask');
  }
  return out;
}
