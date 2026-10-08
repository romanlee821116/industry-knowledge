import { LAYER_MAP } from '../data/layers';
import type { LayerBlock, LayerId, LayerInstances, PaletteKey, StackLayout } from '../types';

/** 爆炸視圖每個槽位的最大間距 */
const EXPLODE_GAP = 0.9;

export type Vec3 = [number, number, number];

export function grid(cols: number, rows: number, w: number, d: number, y: number, cx = 0, cz = 0): Vec3[] {
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

/**
 * 由下往上堆疊的佈局產生器。每個「槽位」在爆炸時往上位移 slot * explode * EXPLODE_GAP；
 * column() 開一條新的堆疊柱（例如測試場景的 CP 與 FT 兩座工作站）。
 */
export function createLayoutBuilder(explode: number) {
  const blocks: LayerBlock[] = [];
  const instances: LayerInstances[] = [];
  let y = 0;
  let slot = 0;
  let originX = 0;
  let originZ = 0;
  const lift = () => slot * explode * EXPLODE_GAP;

  const api = {
    get y() {
      return y;
    },
    /** 目前槽位的爆炸位移後的高度，用於定位 instanced 物件 */
    get liftedY() {
      return y + lift();
    },
    column(x: number, z = 0) {
      originX = x;
      originZ = z;
      y = 0;
      slot = 0;
    },
    block(
      key: string,
      layerId: LayerId,
      size: Vec3,
      palette: PaletteKey,
      opts: { offset?: Vec3; opacity?: number; shape?: LayerBlock['shape'] } = {},
    ) {
      const [ox, oy, oz] = opts.offset ?? [0, 0, 0];
      blocks.push({
        key,
        layerId,
        size,
        palette,
        opacity: opts.opacity,
        shape: opts.shape,
        position: [originX + ox, y + size[1] / 2 + lift() + oy, originZ + oz],
      });
    },
    /** 不受爆炸位移影響的絕對位置方塊（例如 PCB 內層銅） */
    fixedBlock(block: LayerBlock) {
      blocks.push({
        ...block,
        position: [originX + block.position[0], block.position[1], originZ + block.position[2]],
      });
    },
    instances(inst: LayerInstances) {
      instances.push({
        ...inst,
        positions: inst.positions.map(([px, py, pz]) => [originX + px, py, originZ + pz]),
      });
    },
    advance(height: number) {
      y += height;
    },
    nextSlot() {
      slot++;
    },
    build(): StackLayout {
      return { blocks, instances, bounds: computeBounds(blocks, instances) };
    },
  };
  return api;
}

function computeBounds(blocks: LayerBlock[], instances: LayerInstances[]): StackLayout['bounds'] {
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
  const extendWithParent = (id: LayerId, c: Vec3, s: Vec3) => {
    extend(id, c, s);
    const parent = LAYER_MAP[id].parent;
    if (parent) extend(parent, c, s);
  };
  for (const b of blocks) extendWithParent(b.layerId, b.position, b.size);
  for (const inst of instances) {
    const xs = inst.positions.map((p) => p[0]);
    const zs = inst.positions.map((p) => p[2]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);
    extendWithParent(
      inst.layerId,
      [(minX + maxX) / 2, inst.positions[0][1], (minZ + maxZ) / 2],
      [maxX - minX, inst.height, maxZ - minZ],
    );
  }
  return bounds;
}
