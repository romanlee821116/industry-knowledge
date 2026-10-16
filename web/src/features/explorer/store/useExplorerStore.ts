import { create } from 'zustand';

import type { MicroViewId, SceneKey } from '@/features/stack';

import type { Selection, VariantSlot } from '../types';

interface ExplorerState {
  scene: SceneKey;
  selection: Selection | null;
  hoveredLayer: string | null;
  explode: number;
  clipEnabled: boolean;
  clipX: number;
  variants: Record<VariantSlot, string>;
  microView: MicroViewId | null;
  microPart: string | null;
  microExplode: number;
  /** 每次需要鏡頭重新聚焦時遞增 */
  focusKey: number;

  /** 選取；若目標位於其他場景，一併切換場景 */
  select: (selection: Selection | null, scene?: SceneKey) => void;
  setScene: (scene: SceneKey) => void;
  hoverLayer: (id: string | null) => void;
  setExplode: (value: number) => void;
  setClipEnabled: (value: boolean) => void;
  setClipX: (value: number) => void;
  setVariant: (slot: VariantSlot, value: string) => void;
  openMicro: (id: MicroViewId) => void;
  closeMicro: () => void;
  selectMicroPart: (prefix: string | null) => void;
  setMicroExplode: (value: number) => void;
  resetView: () => void;
}

/** 各場景預設拉開程度：封裝與測試的零件上下疊在一起，預設拉開才看得到內部 */
const SCENE_DEFAULT_EXPLODE: Record<SceneKey, number> = { fab: 0.5, package: 0.4, test: 1, rack: 0.5 };

export const useExplorerStore = create<ExplorerState>((set) => ({
  scene: 'package',
  selection: null,
  hoveredLayer: null,
  explode: SCENE_DEFAULT_EXPLODE.package,
  clipEnabled: false,
  clipX: 0,
  variants: {
    interposer: 'cowos-l',
    substrate: 'organic-core',
    'glass-fabric': 'low-cte',
    switch: 'pluggable',
    backplane: 'cable-spine',
    ptfe: 'ptfe-ceramic',
  },
  microView: null,
  microPart: null,
  microExplode: 0,
  focusKey: 0,

  select: (selection, scene) =>
    set((s) => {
      const switching = scene !== undefined && scene !== s.scene;
      return {
        selection,
        focusKey: s.focusKey + 1,
        ...(switching && { scene, explode: SCENE_DEFAULT_EXPLODE[scene], hoveredLayer: null }),
      };
    }),
  setScene: (scene) =>
    set((s) =>
      scene === s.scene
        ? {}
        : {
            scene,
            selection: null,
            hoveredLayer: null,
            explode: SCENE_DEFAULT_EXPLODE[scene],
            clipEnabled: false,
            focusKey: s.focusKey + 1,
          },
    ),
  hoverLayer: (hoveredLayer) => set({ hoveredLayer }),
  setExplode: (explode) => set({ explode }),
  setClipEnabled: (clipEnabled) => set({ clipEnabled }),
  setClipX: (clipX) => set({ clipX }),
  setVariant: (slot, value) => set((s) => ({ variants: { ...s.variants, [slot]: value } })),
  openMicro: (microView) => set({ microView, microPart: null, microExplode: 0 }),
  closeMicro: () => set({ microView: null, microPart: null }),
  // 再點一次同一個部位即取消選取
  selectMicroPart: (microPart) => set((s) => ({ microPart: s.microPart === microPart ? null : microPart })),
  setMicroExplode: (microExplode) => set({ microExplode }),
  resetView: () =>
    set((s) => ({
      selection: null,
      explode: SCENE_DEFAULT_EXPLODE[s.scene],
      clipEnabled: false,
      clipX: 0,
      focusKey: s.focusKey + 1,
    })),
}));
