import type { Material, MicroViewId, ProcessChain, SceneKey, StackLayer, Variant } from '@/features/stack';
import type { CompanyIndexEntry, SectorGroup } from '@/features/sectors';

export type SelectionKind = 'layer' | 'material' | 'sector' | 'company';

export interface Selection {
  kind: SelectionKind;
  id: string;
}

/** 可切換技術版本的對象：中介層、載板核心、玻纖布 */
export type VariantSlot = 'interposer' | 'substrate' | 'glass-fabric' | 'switch' | 'backplane' | 'ptfe';

export interface LinkItem {
  kind: SelectionKind;
  id: string;
  label: string;
}

export interface ChainView {
  chain: ProcessChain;
  /** 與目前選取對象相關的步驟索引 */
  activeSteps: number[];
}

export interface VariantView {
  slot: VariantSlot;
  options: Variant[];
  value: string;
  current: Variant;
}

export type PanelCard =
  | { kind: 'overview'; scene: SceneKey }
  | {
      kind: 'layer';
      layer: StackLayer;
      parent?: LinkItem;
      children: LinkItem[];
      related: LinkItem[];
      materials: LinkItem[];
      sectors: SectorGroup[];
      chain?: ChainView;
      variant?: VariantView;
      microView?: MicroViewId;
    }
  | {
      kind: 'material';
      material: Material;
      usedIn: LinkItem[];
      sectors: SectorGroup[];
      chain?: ChainView;
      variant?: VariantView;
      microView?: MicroViewId;
    }
  | { kind: 'sector'; group: SectorGroup; categoryName: string; anchors: LinkItem[]; sceneLabel: string }
  | { kind: 'company'; company: CompanyIndexEntry };

export interface SearchOption {
  value: string;
  label: string;
  hint: string;
}

export interface SearchGroup {
  label: string;
  options: SearchOption[];
}
