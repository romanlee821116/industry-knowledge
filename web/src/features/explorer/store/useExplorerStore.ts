import { create } from 'zustand';

import type { MicroViewId } from '@/features/stack';

import type { Selection, VariantSlot } from '../types';

interface ExplorerState {
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

  select: (selection: Selection | null) => void;
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

export const useExplorerStore = create<ExplorerState>((set) => ({
  selection: null,
  hoveredLayer: null,
  explode: 0,
  clipEnabled: false,
  clipX: 0,
  variants: { interposer: 'cowos-l', substrate: 'organic-core', 'glass-fabric': 'low-cte' },
  microView: null,
  microPart: null,
  microExplode: 0,
  focusKey: 0,

  select: (selection) => set((s) => ({ selection, focusKey: s.focusKey + 1 })),
  hoverLayer: (hoveredLayer) => set({ hoveredLayer }),
  setExplode: (explode) => set({ explode }),
  setClipEnabled: (clipEnabled) => set({ clipEnabled }),
  setClipX: (clipX) => set({ clipX }),
  setVariant: (slot, value) => set((s) => ({ variants: { ...s.variants, [slot]: value } })),
  openMicro: (microView) => set({ microView, microPart: null, microExplode: 0 }),
  closeMicro: () => set({ microView: null, microPart: null }),
  selectMicroPart: (microPart) => set({ microPart }),
  setMicroExplode: (microExplode) => set({ microExplode }),
  resetView: () =>
    set((s) => ({ selection: null, explode: 0, clipEnabled: false, clipX: 0, focusKey: s.focusKey + 1 })),
}));
