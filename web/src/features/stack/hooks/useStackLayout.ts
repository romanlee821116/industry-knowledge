import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';

import FAB_META from '../data/generated/fab-scene.meta.json';
import PACKAGE_META from '../data/generated/package-scene.meta.json';
import RACK_META from '../data/generated/rack-scene.meta.json';
import TEST_META from '../data/generated/test-scene.meta.json';
import { LAYERS } from '../data/layers';
import type { LayerId, SceneKey, StackLayout } from '../types';

/** 與 SceneModel 的爆炸間距一致 */
export const EXPLODE_GAP = 0.9;

type Vec3 = [number, number, number];

interface MetaEntry {
  center: number[];
  size: number[];
  tier: number;
  anchor: number[];
}

/** 各場景的幾何全部來自 Blender（blender/*_scene.py），這裡只讀模型路徑與各層包圍盒 */
const SCENES: Record<SceneKey, { url: string; meta: Record<string, MetaEntry> }> = {
  fab: { url: '/models/fab_scene.glb', meta: FAB_META },
  package: { url: '/models/package_scene.glb', meta: PACKAGE_META },
  test: { url: '/models/test_scene.glb', meta: TEST_META },
  rack: { url: '/models/rack_scene.glb', meta: RACK_META },
};

// 預先載入四個場景，切換場景時不必暫停渲染（避免 Html 標籤在 Suspense 中途卸載）
Object.values(SCENES).forEach(({ url }) => useGLTF.preload(url));

function union(a: StackLayout['bounds'][LayerId], b: StackLayout['bounds'][LayerId]) {
  const lo = a.center.map((c, i) => Math.min(c - a.size[i] / 2, b.center[i] - b.size[i] / 2));
  const hi = a.center.map((c, i) => Math.max(c + a.size[i] / 2, b.center[i] + b.size[i] / 2));
  return {
    center: [0, 1, 2].map((i) => (lo[i] + hi[i]) / 2) as Vec3,
    size: [0, 1, 2].map((i) => hi[i] - lo[i]) as Vec3,
  };
}

interface Options {
  scene: SceneKey;
  explode: number;
}

/** 依爆炸程度把各層包圍盒與標籤錨點往上平移（tier × explode × gap），並讓父層包含子層 */
export function useStackLayout({ scene, explode }: Options): StackLayout {
  return useMemo(() => {
    const { url, meta } = SCENES[scene];
    const bounds = {} as StackLayout['bounds'];
    const anchors = {} as StackLayout['anchors'];
    for (const [id, e] of Object.entries(meta)) {
      const lift = e.tier * explode * EXPLODE_GAP;
      bounds[id as LayerId] = { center: [e.center[0], e.center[1] + lift, e.center[2]], size: e.size as Vec3 };
      anchors[id as LayerId] = [e.anchor[0], e.anchor[1] + lift, e.anchor[2]];
    }
    for (const layer of LAYERS) {
      const own = bounds[layer.id];
      if (!own || !layer.parent) continue;
      bounds[layer.parent] = bounds[layer.parent] ? union(bounds[layer.parent], own) : own;
    }
    return { bounds, anchors, model: { url } };
  }, [scene, explode]);
}

/** 把父層（例如 substrate）展開成實際渲染的子層 id */
export function expandLayerIds(ids: string[]): Set<string> {
  const out = new Set(ids);
  for (const layer of LAYERS) {
    if (layer.parent && out.has(layer.parent)) out.add(layer.id);
  }
  return out;
}
