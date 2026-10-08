export type LayerId =
  | 'lid'
  | 'gpu'
  | 'hbm'
  | 'ubump'
  | 'interposer'
  | 'c4'
  | 'substrate'
  | 'substrate-buildup'
  | 'substrate-core'
  | 'solder-mask'
  | 'bga'
  | 'server-pcb'
  // 測試場景
  | 'ate-head'
  | 'pogo-tower'
  | 'probe-card-pcb'
  | 'space-transformer'
  | 'probe-head'
  | 'wafer'
  | 'prober-chuck'
  | 'handler'
  | 'dut-package'
  | 'test-socket'
  | 'load-board'
  // 晶圓廠場景
  | 'fab-wafer'
  | 'foup'
  | 'wet-bench'
  | 'chem-supply'
  | 'deposition-tool'
  | 'pvd-chamber'
  | 'sputter-target'
  | 'cvd-chamber'
  | 'ald-chamber'
  | 'gas-cabinet'
  | 'coater-track'
  | 'litho-scanner'
  | 'reticle'
  | 'pellicle'
  | 'etch-tool'
  | 'cmp-tool'
  | 'cmp-pad'
  | 'cmp-slurry'
  | 'pad-conditioner'
  | 'inspection-tool'
  | 'vacuum-pump'
  | 'amhs'
  | 'process-flow'
  // 伺服器機櫃場景
  | 'rack-frame'
  | 'compute-tray'
  | 'gpu-module'
  | 'vrm'
  | 'memory-module'
  | 'retimer-chip'
  | 'nic'
  | 'cooling'
  | 'nvlink-switch'
  | 'nvlink-spine'
  | 'tor-switch'
  | 'optical-module'
  | 'fiber-cable'
  | 'power-shelf'
  | 'psu';

/** 已建模的 3D 場景 */
export type SceneKey = 'fab' | 'package' | 'test' | 'rack';

export type MaterialId = 'glass-fabric' | 'ccl' | 'abf-film' | 'copper-foil' | 'resin';

export type MicroViewId =
  'glass-fabric' | 'substrate-section' | 'probe-contact' | 'pogo-pin' | 'chip-section' | 'transceiver';

export type ProcessChainId = 'laminate' | 'substrate' | 'cowos' | 'test' | 'fab' | 'rack';

/** 材料色票 key：技術插畫風，每種材料固定一色 */
export type PaletteKey =
  | 'pcb'
  | 'copper'
  | 'solder'
  | 'core'
  | 'glassCore'
  | 'abf'
  | 'mask'
  | 'underfill'
  | 'silicon'
  | 'organicRdl'
  | 'die'
  | 'hbm'
  | 'lid'
  | 'glass'
  | 'ceramic'
  | 'probe'
  | 'gold'
  | 'st'
  | 'chuck'
  | 'ate'
  | 'handler'
  | 'socket'
  | 'pogo'
  | 'tool'
  | 'toolDark'
  | 'liquid'
  | 'plasma'
  | 'padDark'
  | 'flow'
  | 'oxide';

export interface Spec {
  label: string;
  value: string;
  /** 數值未經查證，知識卡上標「待確認」 */
  unverified?: boolean;
}

export interface Variant {
  id: string;
  name: string;
  summary: string;
  specs: Spec[];
  palette?: PaletteKey;
  /** 目前量產主流 / 下一代 */
  era: 'mainstream' | 'next' | 'legacy';
}

export interface StackLayer {
  id: LayerId;
  name: string;
  nameEn: string;
  summary: string;
  role: string;
  specs: Spec[];
  materials: MaterialId[];
  /** 所屬場景，未填為 package */
  scene?: SceneKey;
  parent?: LayerId;
  /** 其他場景中相關的結構（知識卡上可直接跳轉） */
  related?: LayerId[];
  microView?: MicroViewId;
  processChain?: ProcessChainId;
  variants?: Variant[];
}

export interface Material {
  id: MaterialId;
  name: string;
  nameEn: string;
  summary: string;
  specs: Spec[];
  usedIn: LayerId[];
  microView?: MicroViewId;
  processChain?: ProcessChainId;
  variants?: Variant[];
}

export interface ProcessStep {
  title: string;
  description: string;
  /** 這一步產出/使用到的材料或結構，用來在製程鏈上標示「你在這裡」 */
  produces?: (MaterialId | LayerId)[];
}

export interface ProcessChain {
  id: ProcessChainId;
  name: string;
  steps: ProcessStep[];
}

export interface MicroPart {
  /** GLB object name prefix */
  prefix: string;
  name: string;
  description: string;
  palette: PaletteKey;
  /** 顯微視圖中的分解位移方向（場景單位） */
  explode?: number;
  opacity?: number;
  links?: (MaterialId | LayerId)[];
}

export interface MicroView {
  id: MicroViewId;
  name: string;
  url: string;
  caption: string;
  scaleNote: string;
  parts: MicroPart[];
}

export interface StackLayout {
  /** Blender 匯出的整體場景模型 */
  model: { url: string };
  /** 每層的包圍盒中心與尺寸（已含爆炸位移），用於鏡頭聚焦 */
  bounds: Record<LayerId, { center: [number, number, number]; size: [number, number, number] }>;
  /** 每層第一個實體的中心，用於標籤（重複出現的托盤只標最下面那個） */
  anchors: Record<LayerId, [number, number, number]>;
}
