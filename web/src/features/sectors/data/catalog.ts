import type { SectorCategoryDef } from '../types';

const PACKAGE_ALL = ['interposer', 'ubump', 'c4', 'gpu', 'hbm', 'substrate'];
const PROBE_CARD = ['probe-card-pcb', 'space-transformer', 'probe-head'];
const TEST_ALL = [
  ...PROBE_CARD,
  'wafer',
  'prober-chuck',
  'ate-head',
  'test-socket',
  'load-board',
  'handler',
  'dut-package',
];

/**
 * 族群索引（來源：使用者提供的台股細族群清單 + 查證後新增的材料族群）。
 * 個股資料只來自 verified/*.json；此處只定義族群名稱、所屬場景與 3D 錨點。
 */
export const CATALOG: SectorCategoryDef[] = [
  {
    id: 'wafer',
    name: '晶圓／製程',
    groups: [
      { id: 'advanced-node', name: '先進製程', scene: 'package', anchors: ['gpu'] },
      { id: 'mature-node', name: '成熟製程', scene: 'fab', anchors: ['fab-wafer'] },
      { id: 'specialty-process', name: '特色製程', scene: 'fab', anchors: ['fab-wafer'] },
      { id: 'wafer-12', name: '12 吋晶圓', scene: 'fab', anchors: ['fab-wafer'] },
      { id: 'wafer-8', name: '8 吋晶圓', scene: 'fab', anchors: ['fab-wafer'] },
      { id: 'wafer-sic', name: 'SiC', scene: 'fab', anchors: ['fab-wafer'] },
      { id: 'wafer-gan', name: 'GaN', scene: 'fab', anchors: ['fab-wafer'] },
      { id: 'soi', name: 'SOI', scene: 'fab', anchors: ['fab-wafer'] },
      {
        id: 'wafer-silicon-photonics',
        name: '矽光子',
        scene: 'rack',
        anchors: ['optical-module'],
        source: 'silicon-photonics',
      },
      { id: 'mems', name: 'MEMS', scene: 'fab', anchors: ['fab-wafer'] },
    ],
  },
  {
    id: 'advanced-packaging',
    name: '先進封裝',
    groups: [
      { id: 'cowos', name: 'CoWoS', scene: 'package', anchors: PACKAGE_ALL },
      { id: 'cowos-s', name: 'CoWoS-S', scene: 'package', anchors: ['interposer'] },
      { id: 'cowos-r', name: 'CoWoS-R', scene: 'package', anchors: ['interposer'] },
      { id: 'cowos-l', name: 'CoWoS-L', scene: 'package', anchors: ['interposer'] },
      { id: 'soic', name: 'SoIC', scene: 'package', anchors: ['ubump', 'gpu'] },
      { id: 'foplp', name: 'FOPLP', scene: 'package', anchors: [] },
      { id: 'packaging-2-5d', name: '2.5D 封裝', scene: 'package', anchors: ['interposer', 'ubump', 'c4'] },
      { id: 'packaging-3d', name: '3D 封裝', scene: 'package', anchors: ['hbm'] },
      { id: 'chiplet', name: 'Chiplet', scene: 'package', anchors: ['gpu', 'interposer'] },
      { id: 'hybrid-bonding', name: '混合鍵結', scene: 'package', anchors: ['ubump'] },
      { id: 'abf-substrate', name: 'ABF 載板', scene: 'package', anchors: ['substrate'] },
      { id: 'ic-substrate', name: 'IC 載板', scene: 'package', anchors: ['substrate'] },
      { id: 'package-substrate', name: '封裝基板', scene: 'package', anchors: ['substrate'] },
    ],
  },
  {
    id: 'equipment',
    name: '半導體設備',
    groups: [
      { id: 'wafer-probe', name: '晶圓探針', scene: 'test', anchors: ['probe-head'] },
      { id: 'probe-card', name: '探針卡', scene: 'test', anchors: PROBE_CARD },
      {
        id: 'test-interface-eq',
        name: '測試介面',
        scene: 'test',
        anchors: [...PROBE_CARD, 'test-socket', 'load-board'],
        source: 'test-interface',
      },
      { id: 'probe-station', name: 'Probe Station', scene: 'test', anchors: ['prober-chuck'] },
      { id: 'wafer-clean', name: '晶圓清洗設備', scene: 'fab', anchors: ['wet-bench'] },
      { id: 'etch', name: '蝕刻設備', scene: 'fab', anchors: ['etch-tool'] },
      { id: 'deposition', name: '薄膜沉積', scene: 'fab', anchors: ['deposition-tool'] },
      { id: 'pvd', name: 'PVD', scene: 'fab', anchors: ['pvd-chamber'] },
      { id: 'cvd', name: 'CVD', scene: 'fab', anchors: ['cvd-chamber'] },
      { id: 'ald', name: 'ALD', scene: 'fab', anchors: ['ald-chamber'] },
      { id: 'cmp-equipment', name: 'CMP', scene: 'fab', anchors: ['cmp-tool'] },
      { id: 'mask-equipment', name: '光罩設備', scene: 'fab', anchors: ['reticle'] },
      { id: 'laser-equipment', name: '雷射設備', scene: 'fab', anchors: ['inspection-tool'] },
      { id: 'wet-process', name: '濕製程設備', scene: 'fab', anchors: ['wet-bench'] },
      { id: 'wafer-handling', name: '晶圓搬運', scene: 'fab', anchors: ['amhs', 'foup'] },
      { id: 'vacuum', name: '真空設備', scene: 'fab', anchors: ['vacuum-pump'] },
    ],
  },
  {
    id: 'materials',
    name: '半導體材料',
    groups: [
      { id: 'glass-fabric', name: '玻纖布', scene: 'package', anchors: ['glass-fabric'] },
      { id: 'ccl', name: 'CCL 銅箔基板', scene: 'package', anchors: ['ccl'] },
      { id: 'copper-foil', name: '銅箔', scene: 'package', anchors: ['copper-foil'] },
      { id: 'resin', name: '樹脂', scene: 'package', anchors: ['resin'] },
      { id: 'abf-film', name: 'ABF 膜', scene: 'package', anchors: ['abf-film'] },
      { id: 'packaging-materials', name: '先進封裝材料', scene: 'package', anchors: ['c4', 'ubump'] },
      { id: 'silicon-wafer', name: '矽晶圓', scene: 'fab', anchors: ['fab-wafer'] },
      { id: 'photoresist', name: '光阻', scene: 'fab', anchors: ['coater-track'] },
      { id: 'specialty-chemicals', name: '特用化學品', scene: 'fab', anchors: ['chem-supply'] },
      { id: 'cmp-slurry', name: 'CMP 研磨液', scene: 'fab', anchors: ['cmp-slurry'] },
      { id: 'cmp-pad', name: 'CMP 研磨墊與鑽石碟', scene: 'fab', anchors: ['cmp-pad', 'pad-conditioner'] },
      { id: 'sputter-target', name: '靶材', scene: 'fab', anchors: ['sputter-target'] },
      { id: 'electronic-gas', name: '電子氣體', scene: 'fab', anchors: ['gas-cabinet'] },
      { id: 'high-purity-chemicals', name: '高純度化學品', scene: 'fab', anchors: ['chem-supply'] },
      { id: 'photomask', name: '光罩', scene: 'fab', anchors: ['reticle'] },
      { id: 'pellicle', name: '光罩保護膜／EUV 耗材', scene: 'fab', anchors: ['pellicle', 'foup'] },
      { id: 'diamond', name: '鑽石材料', scene: 'fab', anchors: ['pad-conditioner'] },
      { id: 'sic-material', name: 'SiC 材料', scene: 'fab', anchors: ['fab-wafer'] },
      { id: 'gan-material', name: 'GaN 材料', scene: 'fab', anchors: ['fab-wafer'] },
    ],
  },
  {
    id: 'ai-hpc',
    name: 'AI／HPC',
    groups: [
      { id: 'ai-asic', name: 'AI ASIC', scene: 'package', anchors: ['gpu'] },
      { id: 'gpu-supply-chain', name: 'GPU 供應鏈', scene: 'package', anchors: PACKAGE_ALL },
      { id: 'asic-design-service', name: 'ASIC 設計服務', scene: 'package', anchors: ['gpu'] },
      { id: 'hbm', name: 'HBM', scene: 'package', anchors: ['hbm'] },
      { id: 'hbm-packaging', name: 'HBM 封裝', scene: 'package', anchors: ['hbm'] },
      { id: 'hbm-test', name: 'HBM 測試', scene: 'test', anchors: ['wafer', 'probe-head'] },
      {
        id: 'high-speed-transmission',
        name: '高速傳輸',
        scene: 'rack',
        anchors: ['gpu-module', 'nvlink-spine', 'server-pcb'],
      },
      { id: 'cxl', name: 'CXL', scene: 'rack', anchors: ['memory-module'] },
      { id: 'pcie', name: 'PCIe', scene: 'rack', anchors: ['retimer-chip', 'nic'] },
      { id: 'serdes', name: 'SerDes', scene: 'rack', anchors: ['nvlink-switch', 'tor-switch', 'optical-module'] },
      { id: 'high-speed-switch', name: '高速交換器', scene: 'rack', anchors: ['tor-switch', 'nvlink-switch'] },
      { id: 'retimer', name: 'Retimer', scene: 'rack', anchors: ['retimer-chip'] },
    ],
  },
  {
    id: 'optical',
    name: '光通訊',
    groups: [
      { id: 'optical-800g', name: '800G', scene: 'rack', anchors: ['optical-module'] },
      { id: 'optical-1-6t', name: '1.6T', scene: 'rack', anchors: ['optical-module', 'tor-switch'] },
      { id: 'transceiver', name: '光收發模組', scene: 'rack', anchors: ['optical-module'] },
      { id: 'optical-engine', name: '光引擎', scene: 'rack', anchors: ['optical-module'] },
      { id: 'eml', name: 'EML', scene: 'rack', anchors: ['optical-module'] },
      { id: 'vcsel', name: 'VCSEL', scene: 'rack', anchors: ['optical-module'] },
      { id: 'silicon-photonics', name: '矽光子', scene: 'rack', anchors: ['optical-module'] },
      { id: 'optical-fiber', name: '光纖', scene: 'rack', anchors: ['fiber-cable'] },
      { id: 'fiber-connector', name: '光纖連接器', scene: 'rack', anchors: ['fiber-cable'] },
      { id: 'optical-coupling', name: '光耦合', scene: 'rack', anchors: ['optical-module', 'fiber-cable'] },
      { id: 'optical-laser', name: '光通訊雷射', scene: 'rack', anchors: ['optical-module'] },
    ],
  },
  {
    id: 'power',
    name: '電源／功率半導體',
    groups: [
      { id: 'power-gan', name: 'GaN', scene: 'rack', anchors: ['psu'] },
      { id: 'power-sic', name: 'SiC', scene: 'rack', anchors: ['psu'] },
      { id: 'gan-charger', name: 'GaN 充電器', scene: 'rack', anchors: [] },
      { id: 'gan-power-ic', name: 'GaN 功率 IC', scene: 'rack', anchors: ['psu', 'vrm'] },
      { id: 'sic-mosfet', name: 'SiC MOSFET', scene: 'rack', anchors: ['psu'] },
      { id: 'igbt', name: 'IGBT', scene: 'rack', anchors: [] },
      { id: 'power-module', name: '功率模組', scene: 'rack', anchors: ['power-shelf'] },
      { id: 'auto-power', name: '車用功率半導體', scene: 'rack', anchors: [] },
      { id: 'pmic', name: 'PMIC', scene: 'rack', anchors: ['vrm'] },
    ],
  },
  {
    id: 'testing',
    name: '測試',
    groups: [
      { id: 'ic-test', name: 'IC 測試', scene: 'test', anchors: ['dut-package', 'wafer'] },
      { id: 'wafer-test', name: '晶圓測試', scene: 'test', anchors: ['wafer', 'probe-head'] },
      { id: 'test-probe-card', name: '探針卡', scene: 'test', anchors: PROBE_CARD, source: 'probe-card' },
      { id: 'test-socket', name: '測試座 Socket', scene: 'test', anchors: ['test-socket'] },
      { id: 'test-interface', name: '測試介面', scene: 'test', anchors: [...PROBE_CARD, 'test-socket', 'load-board'] },
      { id: 'burn-in', name: 'Burn-in', scene: 'test', anchors: [] },
      { id: 'ate', name: '高階 ATE', scene: 'test', anchors: ['ate-head'] },
      {
        id: 'high-speed-test',
        name: '高速測試',
        scene: 'test',
        anchors: ['load-board', 'test-socket', 'probe-card-pcb'],
      },
      { id: 'ai-chip-test', name: 'AI 晶片測試', scene: 'test', anchors: TEST_ALL },
      { id: 'test-load-board', name: '測試載板', scene: 'test', anchors: ['load-board', 'probe-card-pcb'] },
      { id: 'test-handler', name: '分類機 Handler', scene: 'test', anchors: ['handler'] },
      { id: 'slt', name: '系統級測試 SLT', scene: 'test', anchors: [] },
    ],
  },
];

/** 已有 3D 模型的場景 */
export const MODELED_SCENES = ['fab', 'package', 'test', 'rack'];

export const SCENE_LABEL: Record<string, string> = {
  package: 'CoWoS 封裝堆疊',
  fab: '晶圓廠製程線',
  test: '測試場景',
  rack: 'AI 伺服器機櫃',
  design: 'IC 設計',
};

/**
 * 個股在 3D 堆疊中的實際位置（覆寫族群錨點）。
 * 例：欣興屬於 CoWoS 族群，但它做的是載板，不應高亮整個封裝。
 * 空陣列表示該公司產品不在封裝堆疊內（設備、測試），只顯示知識卡不高亮。
 */
export const COMPANY_ANCHORS: Record<string, string[]> = {
  '3037': ['substrate'],
  '8046': ['substrate'],
  '3189': ['substrate'],
  '4958': ['substrate'],
  // 測試代工：CP 與 FT 都做
  '2449': ['wafer', 'dut-package'],
  '3264': ['wafer', 'dut-package'],
  '6257': ['wafer', 'dut-package'],
  // 測試介面耗材
  '6510': ['probe-card-pcb', 'space-transformer', 'probe-head', 'load-board'],
  '6223': ['probe-card-pcb', 'space-transformer', 'probe-head', 'prober-chuck'],
  '6515': ['test-socket', 'probe-head'],
  '6683': ['load-board', 'probe-card-pcb'],
  '6217': ['test-socket', 'probe-head'],
  '7856': ['probe-card-pcb', 'space-transformer', 'probe-head'],
  '2368': ['load-board'],
  '6141': ['load-board'],
  '8155': ['load-board'],
  '5439': ['load-board'],
  // 測試設備
  '2360': ['ate-head', 'handler'],
  '7769': ['handler'],
  // 前段耗材：精準定位到機台上的零件
  '1560': ['pad-conditioner'],
  '7768': ['cmp-pad'],
  '1307': ['cmp-pad'],
  '3680': ['foup'],
  // 前段設備：依查證後的實際角色定位（原廠／代工／零組件／代理）
  '3131': ['wet-bench'],
  '3583': ['wet-bench'],
  '6937': ['pvd-chamber', 'ald-chamber'],
  '3413': ['deposition-tool', 'etch-tool', 'cmp-tool'],
  '6829': ['deposition-tool'],
  '3178': ['pvd-chamber', 'cvd-chamber'],
  '8091': ['vacuum-pump'],
  '6196': ['gas-cabinet', 'cvd-chamber'],
  '2464': ['amhs'],
  '6788': ['foup'],
  '6953': ['reticle'],
  '5443': ['cmp-tool'],
  '8027': ['inspection-tool'],
  '6207': ['inspection-tool'],
  // 光通訊：被動元件廠只亮光纖、交換器廠只亮交換器
  '6442': ['fiber-cable'],
  '3163': ['fiber-cable'],
  '4903': ['fiber-cable'],
  '2345': ['tor-switch'],
  // AI 伺服器電源與互連
  '2308': ['power-shelf', 'psu'],
  '2301': ['power-shelf', 'psu'],
  '6282': ['power-shelf', 'psu'],
  '6412': ['psu'],
  '2317': ['nvlink-switch', 'compute-tray'],
  '3665': ['nvlink-spine'],
  '4966': ['retimer-chip'],
  '8299': ['retimer-chip'],
  // 先進封裝設備：目前場景未建模
  '6187': [],
  '2467': [],
  '8064': [],
};
