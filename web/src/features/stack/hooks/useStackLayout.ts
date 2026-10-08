import { useMemo } from 'react';

import { LAYERS } from '../data/layers';
import type { LayerId, PaletteKey, SceneKey, StackLayout } from '../types';
import { createLayoutBuilder, grid, type Vec3 } from './layoutBuilder';

interface Options {
  scene: SceneKey;
  explode: number;
  interposerVariant: string;
  substrateVariant: string;
}

/** 依場景計算每個方塊的位置（厚度誇張化，非真實比例） */
export function useStackLayout({ scene, explode, interposerVariant, substrateVariant }: Options): StackLayout {
  return useMemo(
    () =>
      scene === 'test'
        ? buildTest(explode)
        : scene === 'fab'
          ? buildFab(explode)
          : buildPackage(explode, interposerVariant, substrateVariant),
    [scene, explode, interposerVariant, substrateVariant],
  );
}

/** 把父層（例如 substrate）展開成實際渲染的子層 id */
export function expandLayerIds(ids: string[]): Set<string> {
  const out = new Set(ids);
  for (const layer of LAYERS) {
    if (layer.parent && out.has(layer.parent)) out.add(layer.id);
  }
  return out;
}

function buildPackage(explode: number, interposerVariant: string, substrateVariant: string): StackLayout {
  const b = createLayoutBuilder(explode);

  // --- PCB：多層 CCL，側面看得到內層銅 ---
  const pcbT = 0.7;
  b.block('pcb', 'server-pcb', [24, pcbT, 20], 'pcb');
  for (let i = 1; i < 6; i++) {
    b.fixedBlock({
      key: `pcb-cu-${i}`,
      layerId: 'server-pcb',
      size: [24.04, 0.025, 20.04],
      palette: 'copper',
      position: [0, (pcbT * i) / 6, 0],
    });
  }
  b.advance(pcbT);
  b.nextSlot();

  // --- BGA ---
  const bgaH = 0.5;
  b.instances({
    key: 'bga',
    layerId: 'bga',
    shape: 'sphere',
    radius: 0.28,
    height: bgaH,
    palette: 'solder',
    positions: grid(13, 13, 11, 11, b.liftedY + bgaH / 2),
  });
  b.advance(bgaH);
  b.nextSlot();

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
    b.block(key, id, [sub, t, sub], palette, { opacity });
    b.advance(t);
    b.nextSlot();
  }

  // --- C4 + underfill ---
  const ipW = 8;
  const ipD = 6;
  const c4H = 0.22;
  b.instances({
    key: 'c4',
    layerId: 'c4',
    shape: 'sphere',
    radius: 0.11,
    height: c4H,
    palette: 'solder',
    positions: grid(20, 15, ipW - 0.4, ipD - 0.4, b.liftedY + c4H / 2),
  });
  b.block('underfill', 'c4', [ipW + 0.3, c4H, ipD + 0.3], 'underfill', { opacity: 0.35 });
  b.advance(c4H);
  b.nextSlot();

  // --- 中介層（S / R / L） ---
  const ipT = 0.28;
  b.block('interposer', 'interposer', [ipW, ipT, ipD], interposerVariant === 'cowos-s' ? 'silicon' : 'organicRdl');
  if (interposerVariant === 'cowos-l') {
    // LSI 局部矽橋：位於 GPU 與 GPU、GPU 與 HBM 交界下方；略高於中介層，上下表面露出、不與 RDL 面重疊閃爍
    const bridges: [number, number][] = [
      [0, -0.9],
      [0, 0.9],
      ...[-2.1, -0.7, 0.7, 2.1].flatMap<[number, number]>((z) => [
        [-2.6, z],
        [2.6, z],
      ]),
    ];
    bridges.forEach(([x, z], i) =>
      b.block(`lsi-${i}`, 'interposer', [0.7, ipT + 0.012, 0.45], 'silicon', { offset: [x, -0.006, z] }),
    );
  }
  b.advance(ipT);
  b.nextSlot();

  // --- µBump ---
  const ubH = 0.1;
  const dieW = 2.4;
  const dieD = 3.4;
  const gpuX = [-1.3, 1.3];
  const hbmX = [-3.3, 3.3];
  const hbmZ = [-2.1, -0.7, 0.7, 2.1];
  const ubY = b.liftedY + ubH / 2;
  b.instances({
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
  b.advance(ubH);
  b.nextSlot();

  // --- GPU 晶粒 + HBM 堆疊（同一槽位） ---
  const dieT = 0.45;
  gpuX.forEach((x, i) => b.block(`gpu-${i}`, 'gpu', [dieW, dieT, dieD], 'die', { offset: [x, 0, 0] }));
  const sliceT = 0.07;
  hbmX.forEach((x, i) =>
    hbmZ.forEach((z, j) => {
      for (let k = 0; k < 9; k++) {
        b.block(`hbm-${i}-${j}-${k}`, 'hbm', [1.1, sliceT - 0.008, 1.2], k === 0 ? 'die' : 'hbm', {
          offset: [x, k * sliceT, z],
        });
      }
    }),
  );
  b.advance(Math.max(dieT, 9 * sliceT));
  b.nextSlot();

  // --- 蓋板 ---
  b.advance(0.15);
  b.block('lid', 'lid', [sub, 0.2, sub], 'lid', { opacity: 0.28 });

  return b.build();
}

/** 測試場景：左 CP（探針卡壓晶圓）、右 FT（測試座接封裝） */
function buildTest(explode: number): StackLayout {
  const b = createLayoutBuilder(explode);
  const step = (h: number) => {
    b.advance(h);
    b.nextSlot();
  };

  // ===== CP 晶圓測試站 =====
  b.column(-7.5);
  b.block('chuck', 'prober-chuck', [9, 0.6, 9], 'chuck', { shape: 'cylinder' });
  step(0.6);

  b.block('wafer', 'wafer', [8, 0.08, 8], 'silicon', { shape: 'cylinder' });
  const dies: Vec3[] = grid(9, 9, 6.4, 6.4, 0).filter(([x, , z]) => Math.hypot(x, z) < 3.6);
  dies.forEach(([x, , z], i) => b.block(`die-${i}`, 'wafer', [0.68, 0.02, 0.68], 'die', { offset: [x, 0.08, z] }));
  step(0.1);

  // 探針：針尖朝下，下端略突出探針頭底面
  const headT = 0.5;
  const pinH = 0.65;
  const gap = 0.15;
  b.instances({
    key: 'probes',
    layerId: 'probe-head',
    shape: 'cylinder',
    radius: 0.025,
    height: pinH,
    palette: 'probe',
    positions: grid(16, 16, 2.0, 2.0, b.liftedY + gap + pinH / 2),
  });
  b.block('probe-head', 'probe-head', [2.4, headT, 2.4], 'ceramic', { offset: [0, gap + 0.1, 0], opacity: 0.55 });
  step(gap + 0.1 + headT);

  b.block('st', 'space-transformer', [3.4, 0.25, 3.4], 'st');
  step(0.25);

  b.block('probe-card-pcb', 'probe-card-pcb', [11, 0.4, 11], 'pcb', { shape: 'cylinder' });
  b.block('pc-stiffener', 'probe-card-pcb', [4.4, 0.25, 4.4], 'chuck', { offset: [0, 0.4, 0] });
  step(0.65);

  b.block('pogo-tower', 'pogo-tower', [10, 0.7, 10], 'pogo', { shape: 'cylinder', opacity: 0.45 });
  step(0.7);

  b.block('ate-head-cp', 'ate-head', [10.5, 1.3, 10], 'ate');

  // ===== FT 成品測試站 =====
  b.column(7.5);
  b.block('ate-head-ft', 'ate-head', [9, 1.3, 8], 'ate');
  step(1.3);

  b.block('load-board', 'load-board', [8, 0.35, 7], 'pcb');
  step(0.35);

  const socketT = 0.6;
  b.block('socket', 'test-socket', [3.4, socketT, 3.4], 'socket');
  b.instances({
    key: 'pogo-pins',
    layerId: 'test-socket',
    shape: 'cylinder',
    radius: 0.05,
    height: 0.1,
    palette: 'gold',
    positions: grid(14, 14, 2.4, 2.4, b.liftedY + socketT + 0.05),
  });
  step(socketT + 0.1);

  b.block('dut-substrate', 'dut-package', [2.8, 0.22, 2.8], 'abf');
  b.block('dut-lid', 'dut-package', [2.2, 0.16, 2.2], 'lid', { offset: [0, 0.22, 0] });
  step(0.38);

  b.block('handler-head', 'handler', [3.2, 0.8, 3.2], 'handler');
  b.block('handler-arm', 'handler', [1.4, 1.6, 1.4], 'handler', { offset: [0, 0.8, 0] });

  return b.build();
}

/** 晶圓廠場景：8 座機台沿製程循環排成一圈，天花板為天車軌道 */
const FAB_RX = 13;
const FAB_RZ = 8;

/** 第 i 站在橢圓上的位置（由正前方逆時針排列） */
export function fabStationPosition(i: number, count = 8): [number, number] {
  const a = Math.PI / 2 + (i * 2 * Math.PI) / count;
  return [FAB_RX * Math.cos(a), FAB_RZ * Math.sin(a)];
}

function buildFab(explode: number): StackLayout {
  const b = createLayoutBuilder(explode);
  const station = (i: number) => b.column(...fabStationPosition(i));
  const step = (h: number) => {
    b.advance(h);
    b.nextSlot();
  };

  // ① 晶圓與 FOUP：爆炸時晶圓從傳送盒中升起
  station(0);
  b.block('foup', 'foup', [2.2, 2.2, 2.4], 'tool', { opacity: 0.35 });
  for (let k = 0; k < 6; k++) {
    b.block(`foup-wafer-${k}`, 'fab-wafer', [1.9, 0.03, 1.9], 'silicon', {
      shape: 'cylinder',
      offset: [0, 0.3 + k * 0.3, 0],
    });
  }
  step(2.3);
  b.block('wafer-showcase', 'fab-wafer', [3, 0.06, 3], 'silicon', { shape: 'cylinder' });
  grid(7, 7, 2.1, 2.1, 0)
    .filter(([x, , z]) => Math.hypot(x, z) < 1.3)
    .forEach(([x, , z], k) =>
      b.block(`wafer-die-${k}`, 'fab-wafer', [0.3, 0.015, 0.3], 'die', { offset: [x, 0.06, z] }),
    );

  // ② 濕式清洗＋化學品供應
  station(1);
  b.block('wet-base', 'wet-bench', [5, 1.2, 2], 'tool');
  b.block('chem-tank-0', 'chem-supply', [0.9, 2, 0.9], 'tool', { shape: 'cylinder', offset: [-1.4, 0, -1.9] });
  b.block('chem-tank-1', 'chem-supply', [0.9, 2, 0.9], 'tool', { shape: 'cylinder', offset: [-0.2, 0, -1.9] });
  step(1.2);
  [-1.6, 0, 1.6].forEach((x, k) =>
    b.block(`wet-tank-${k}`, 'wet-bench', [1.2, 0.5, 1.4], 'liquid', { offset: [x, 0, 0], opacity: 0.6 }),
  );

  // ③ 薄膜沉積叢集：中央傳送腔＋PVD／CVD／ALD 製程腔＋特氣櫃＋真空幫浦
  station(2);
  const chambers: [string, LayerId, number][] = [
    ['pvd', 'pvd-chamber', 0],
    ['cvd', 'cvd-chamber', (2 * Math.PI) / 3],
    ['ald', 'ald-chamber', (4 * Math.PI) / 3],
  ];
  const at = (a: number, r: number): Vec3 => [r * Math.cos(a), 0, r * Math.sin(a)];
  b.block('transfer', 'deposition-tool', [2, 1, 2], 'toolDark', { shape: 'cylinder' });
  chambers.forEach(([key, id, a]) => {
    b.block(`chamber-${key}`, id, [1.5, 1.3, 1.5], 'tool', { shape: 'cylinder', offset: at(a, 1.9) });
    b.block(`pump-${key}`, 'vacuum-pump', [0.55, 0.5, 0.55], 'toolDark', { offset: at(a, 3.05) });
  });
  b.block('gas-cabinet', 'gas-cabinet', [0.9, 2.4, 0.9], 'toolDark', { offset: [-2.4, 0, 2.4] });
  step(1.3);
  b.block('target', 'sputter-target', [1.2, 0.12, 1.2], 'copper', { shape: 'cylinder', offset: at(0, 1.9) });

  // ④ 塗佈顯影（光阻）
  station(3);
  b.block('track', 'coater-track', [3, 1.2, 2], 'tool');
  step(1.2);
  b.block('spin-cup', 'coater-track', [1, 0.3, 1], 'toolDark', { shape: 'cylinder' });

  // ⑤ 曝光機＋光罩＋保護膜
  station(4);
  b.block('scanner', 'litho-scanner', [4.5, 2.4, 3], 'tool');
  step(2.4);
  b.block('reticle', 'reticle', [1.3, 0.06, 1.3], 'oxide');
  step(0.06);
  b.block('pellicle', 'pellicle', [1.3, 0.03, 1.3], 'glass', { opacity: 0.5 });

  // ⑥ 乾式蝕刻：透明腔體內的電漿
  station(5);
  b.block('etch-base', 'etch-tool', [2.6, 0.8, 2.6], 'toolDark');
  b.block('etch-pump', 'vacuum-pump', [0.6, 0.5, 0.6], 'toolDark', { offset: [1.7, 0, 0] });
  step(0.8);
  b.block('etch-chamber', 'etch-tool', [2, 1.4, 2], 'tool', { shape: 'cylinder', opacity: 0.4 });
  b.block('plasma', 'etch-tool', [1.6, 0.4, 1.6], 'plasma', { shape: 'cylinder', offset: [0, 0.5, 0], opacity: 0.75 });

  // ⑦ CMP：研磨墊 → 研磨頭／鑽石碟／研磨液臂
  station(6);
  b.block('cmp-base', 'cmp-tool', [4, 1, 3], 'tool');
  step(1);
  b.block('cmp-pad', 'cmp-pad', [2.6, 0.1, 2.6], 'padDark', { shape: 'cylinder' });
  step(0.1);
  b.block('cmp-head', 'cmp-tool', [0.9, 0.4, 0.9], 'toolDark', { shape: 'cylinder', offset: [0.5, 0, 0.2] });
  b.block('conditioner', 'pad-conditioner', [0.6, 0.15, 0.6], 'solder', { shape: 'cylinder', offset: [-0.7, 0, 0.6] });
  b.block('slurry-arm', 'cmp-slurry', [1.4, 0.1, 0.15], 'liquid', { offset: [-0.3, 0.4, -0.8] });

  // ⑧ 檢測量測／雷射
  station(7);
  b.block('inspect', 'inspection-tool', [2.6, 1.6, 2.2], 'tool');
  step(1.6);
  b.block('inspect-head', 'inspection-tool', [0.9, 0.5, 0.9], 'toolDark', { shape: 'cylinder' });

  // 天車軌道（固定在天花板）與地面的製程循環路線
  b.column(0, 0);
  const ring = (rx: number, rz: number, n: number) =>
    Array.from({ length: n }, (_, k) => {
      const a = (k / n) * 2 * Math.PI;
      return [rx * Math.cos(a), rz * Math.sin(a)] as const;
    });
  ring(FAB_RX, FAB_RZ, 96).forEach(([x, z], k) =>
    b.fixedBlock({
      key: `rail-${k}`,
      layerId: 'amhs',
      size: [0.35, 0.12, 0.35],
      palette: 'toolDark',
      position: [x, 6, z],
    }),
  );
  [0.6, 3.4].forEach((a, k) => {
    const [x, z] = [FAB_RX * Math.cos(a), FAB_RZ * Math.sin(a)];
    b.fixedBlock({
      key: `oht-${k}`,
      layerId: 'amhs',
      size: [0.8, 0.5, 0.8],
      palette: 'handler',
      position: [x, 5.65, z],
    });
    b.fixedBlock({
      key: `oht-foup-${k}`,
      layerId: 'amhs',
      size: [0.7, 0.6, 0.75],
      palette: 'tool',
      position: [x, 5.1, z],
    });
  });
  ring(8.5, 4, 60).forEach(([x, z], k) =>
    b.fixedBlock({
      key: `flow-${k}`,
      layerId: 'process-flow',
      size: k % 5 === 0 ? [0.5, 0.05, 0.5] : [0.22, 0.04, 0.22],
      palette: 'flow',
      opacity: 0.8,
      position: [x, 0.03, z],
    }),
  );

  return b.build();
}
