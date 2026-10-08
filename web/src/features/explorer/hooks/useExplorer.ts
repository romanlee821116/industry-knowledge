import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { SCENE_LABEL, useSectorCatalog, type SectorCatalog } from '@/features/sectors';
import {
  expandLayerIds,
  GLASS_TINT,
  LAYER_MAP,
  LAYERS,
  MATERIAL_MAP,
  MATERIALS,
  MICRO_VIEWS,
  PROCESS_CHAINS,
  useStackLayout,
  type FocusBox,
  type LayerId,
  type MaterialId,
  type ProcessChainId,
  type StackLabel,
  type StackLayout,
  type Variant,
} from '@/features/stack';

import { useExplorerStore } from '../store/useExplorerStore';
import type { ChainView, LinkItem, PanelCard, SearchGroup, Selection, VariantSlot, VariantView } from '../types';

const isLayer = (id: string): id is LayerId => id in LAYER_MAP;
const isMaterial = (id: string): id is MaterialId => id in MATERIAL_MAP;

function linkOf(id: string): LinkItem | null {
  if (isLayer(id)) return { kind: 'layer', id, label: LAYER_MAP[id].name };
  if (isMaterial(id)) return { kind: 'material', id, label: MATERIAL_MAP[id].name };
  return null;
}

const links = (ids: string[]) => ids.map(linkOf).filter((l): l is LinkItem => l !== null);

/** 3D 錨點（層或材料）→ 實際要高亮的渲染層 */
function anchorsToLayers(anchorIds: string[]): string[] {
  return anchorIds.flatMap((id) => (isMaterial(id) ? MATERIAL_MAP[id].usedIn : [id]));
}

function chainView(id: ProcessChainId | undefined, target: string): ChainView | undefined {
  if (!id) return undefined;
  const chain = PROCESS_CHAINS[id];
  const activeSteps = chain.steps.flatMap((s, i) => (s.produces?.includes(target as never) ? [i] : []));
  return { chain, activeSteps };
}

function variantView(slot: VariantSlot, options: Variant[] | undefined, value: string): VariantView | undefined {
  if (!options) return undefined;
  const current = options.find((o) => o.id === value) ?? options[0];
  return { slot, options, value: current.id, current };
}

function unionBounds(layout: StackLayout, ids: Iterable<string>): FocusBox | null {
  let min: number[] | null = null;
  let max: number[] | null = null;
  for (const id of ids) {
    const b = layout.bounds[id as LayerId];
    if (!b) continue;
    const lo = b.center.map((c, a) => c - b.size[a] / 2);
    const hi = b.center.map((c, a) => c + b.size[a] / 2);
    min = min ? min.map((v, a) => Math.min(v, lo[a])) : lo;
    max = max ? max.map((v, a) => Math.max(v, hi[a])) : hi;
  }
  if (!min || !max) return null;
  const mn = min;
  const mx = max;
  return {
    center: [0, 1, 2].map((a) => (mn[a] + mx[a]) / 2) as FocusBox['center'],
    size: [0, 1, 2].map((a) => mx[a] - mn[a]) as FocusBox['size'],
  };
}

const LABEL_NUDGE: Partial<Record<LayerId, number>> = { gpu: -0.35, hbm: 0.35 };
const LABEL_IDS: LayerId[] = ['lid', 'gpu', 'hbm', 'ubump', 'interposer', 'c4', 'substrate', 'bga', 'server-pcb'];

export function useExplorer() {
  const state = useExplorerStore(
    useShallow((s) => ({
      selection: s.selection,
      hoveredLayer: s.hoveredLayer,
      explode: s.explode,
      clipEnabled: s.clipEnabled,
      clipX: s.clipX,
      variants: s.variants,
      focusKey: s.focusKey,
    })),
  );
  const actions = useExplorerStore(
    useShallow((s) => ({
      select: s.select,
      hoverLayer: s.hoverLayer,
      setExplode: s.setExplode,
      setClipEnabled: s.setClipEnabled,
      setClipX: s.setClipX,
      setVariant: s.setVariant,
      openMicro: s.openMicro,
      resetView: s.resetView,
    })),
  );
  const catalog = useSectorCatalog();
  const { selection, variants } = state;

  const layout = useStackLayout({
    explode: state.explode,
    interposerVariant: variants.interposer,
    substrateVariant: variants.substrate,
  });

  const highlightIds = useMemo(() => highlightFor(selection, catalog), [selection, catalog]);
  const highlighted = useMemo(() => expandLayerIds(highlightIds), [highlightIds]);

  const card = useMemo<PanelCard>(() => buildCard(selection, catalog, variants), [selection, catalog, variants]);

  const labels = useMemo<StackLabel[]>(() => {
    if (state.explode < 0.35) return [];
    return LABEL_IDS.flatMap((id) => {
      const b = layout.bounds[id];
      if (!b) return [];
      // GPU 與 HBM 在同一槽位，標籤上下錯開避免重疊
      const dy = LABEL_NUDGE[id] ?? 0;
      return [
        { id, name: LAYER_MAP[id].name, position: [b.center[0] + b.size[0] / 2 + 0.2, b.center[1] + dy, b.center[2]] },
      ];
    });
  }, [layout, state.explode]);

  // 聚焦框只在 focusKey 改變時被相機讀取，因此依當下佈局計算即可
  const focus = useMemo(() => (selection ? unionBounds(layout, highlighted) : null), [layout, highlighted, selection]);

  const searchGroups = useMemo<SearchGroup[]>(
    () => [
      {
        label: '結構層',
        options: LAYERS.map((l) => ({ value: `layer:${l.id}`, label: l.name, hint: l.nameEn })),
      },
      {
        label: '材料',
        options: MATERIALS.map((m) => ({ value: `material:${m.id}`, label: m.name, hint: m.nameEn })),
      },
      {
        label: '族群',
        options: catalog.categories.flatMap((c) =>
          c.groups.map((g) => ({ value: `sector:${g.id}`, label: g.name, hint: c.name })),
        ),
      },
      {
        label: '個股',
        options: catalog.companies.map((c) => ({
          value: `company:${c.ticker}`,
          label: `${c.name} ${c.ticker}`,
          hint: c.memberships.map((m) => m.groupName).join('、'),
        })),
      },
    ],
    [catalog],
  );

  const selectedLayerId = selection?.kind === 'layer' ? selection.id : null;
  const selectedSectorId = selection?.kind === 'sector' ? selection.id : null;

  return {
    canvas: {
      layout,
      highlighted,
      selectedId: selectedLayerId,
      hoveredId: state.hoveredLayer,
      clipX: state.clipEnabled ? state.clipX : null,
      labels,
      focus,
      focusKey: state.focusKey,
      lidPassive: state.explode < 0.15,
      onSelectLayer: (id: string) => actions.select({ kind: 'layer', id }),
      onHoverLayer: actions.hoverLayer,
    },
    toolbar: {
      explode: state.explode,
      clipEnabled: state.clipEnabled,
      clipX: state.clipX,
      onExplodeChange: actions.setExplode,
      onClipEnabledChange: actions.setClipEnabled,
      onClipXChange: actions.setClipX,
      onReset: actions.resetView,
    },
    sidebar: {
      categories: catalog.categories,
      selectedGroupId: selectedSectorId,
      onSelectGroup: (id: string) => actions.select({ kind: 'sector', id }),
    },
    search: {
      groups: searchGroups,
      onSelect: (value: string) => {
        const [kind, ...rest] = value.split(':');
        actions.select({ kind: kind as Selection['kind'], id: rest.join(':') });
      },
    },
    panel: {
      card,
      onNavigate: (item: Selection) => actions.select(item),
      onVariantChange: (slot: VariantSlot, value: string) => actions.setVariant(slot, value),
      onOpenMicro: actions.openMicro,
      onClose: () => actions.select(null),
    },
    glassTint: GLASS_TINT[variants['glass-fabric']],
  };
}

function highlightFor(selection: Selection | null, catalog: SectorCatalog): string[] {
  if (!selection) return [];
  switch (selection.kind) {
    case 'layer':
      return [selection.id];
    case 'material':
      return isMaterial(selection.id) ? MATERIAL_MAP[selection.id].usedIn : [];
    case 'sector':
      return anchorsToLayers(catalog.getGroup(selection.id)?.anchors ?? []);
    case 'company':
      return anchorsToLayers(catalog.companyAnchors(selection.id));
  }
}

function buildCard(
  selection: Selection | null,
  catalog: SectorCatalog,
  variants: Record<VariantSlot, string>,
): PanelCard {
  if (!selection) return { kind: 'overview' };

  if (selection.kind === 'layer' && isLayer(selection.id)) {
    const layer = LAYER_MAP[selection.id];
    const slot: VariantSlot | null =
      layer.id === 'interposer' ? 'interposer' : layer.id === 'substrate' ? 'substrate' : null;
    return {
      kind: 'layer',
      layer,
      parent: layer.parent ? (linkOf(layer.parent) ?? undefined) : undefined,
      children: links(LAYERS.filter((l) => l.parent === layer.id).map((l) => l.id)),
      materials: links(layer.materials),
      sectors: [layer.id, ...(layer.parent ? [layer.parent] : [])].flatMap((id) => catalog.groupsForTarget(id)),
      chain: chainView(layer.processChain, layer.id),
      variant: slot ? variantView(slot, layer.variants, variants[slot]) : undefined,
      microView: layer.microView,
    };
  }

  if (selection.kind === 'material' && isMaterial(selection.id)) {
    const material = MATERIAL_MAP[selection.id];
    return {
      kind: 'material',
      material,
      usedIn: links(material.usedIn),
      sectors: catalog.groupsForTarget(material.id),
      chain: chainView(material.processChain, material.id),
      variant:
        material.id === 'glass-fabric'
          ? variantView('glass-fabric', material.variants, variants['glass-fabric'])
          : undefined,
      microView: material.microView,
    };
  }

  if (selection.kind === 'sector') {
    const group = catalog.getGroup(selection.id);
    if (group) {
      return {
        kind: 'sector',
        group,
        categoryName: catalog.categories.find((c) => c.id === group.categoryId)?.name ?? '',
        anchors: links(group.anchors),
        sceneLabel: SCENE_LABEL[group.scene],
      };
    }
  }

  if (selection.kind === 'company') {
    const company = catalog.getCompany(selection.id);
    if (company) return { kind: 'company', company };
  }

  return { kind: 'overview' };
}

export function useMicroView() {
  const s = useExplorerStore(
    useShallow((st) => ({
      microView: st.microView,
      microPart: st.microPart,
      microExplode: st.microExplode,
      glassVariant: st.variants['glass-fabric'],
      closeMicro: st.closeMicro,
      selectMicroPart: st.selectMicroPart,
      setMicroExplode: st.setMicroExplode,
      select: st.select,
    })),
  );
  const view = s.microView ? MICRO_VIEWS[s.microView] : null;
  const part = view?.parts.find((p) => p.prefix === s.microPart) ?? null;
  return {
    open: Boolean(view),
    view,
    part,
    partLinks: links(part?.links ?? []),
    explode: s.microExplode,
    canExplode: Boolean(view?.parts.some((p) => p.explode)),
    glassTint: GLASS_TINT[s.glassVariant],
    onClose: s.closeMicro,
    onSelectPart: s.selectMicroPart,
    onExplodeChange: s.setMicroExplode,
    onNavigate: (item: Selection) => {
      s.closeMicro();
      s.select(item);
    },
  };
}
