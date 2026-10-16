import type { SceneKey, StackLayer } from '../types';
import { FAB_LAYERS } from './fab-layers';
import { RACK_LAYERS } from './rack-layers';
import { TEST_LAYERS } from './test-layers';

/**
 * CoWoS AI GPU 封裝全堆疊（由上到下）。
 * 數值為量級參考；標記 unverified 者尚未對照一手資料，待審。
 */
const PACKAGE_LAYERS: StackLayer[] = [
  {
    id: 'lid',
    name: '封裝蓋板＋熱介面材料',
    nameEn: 'Lid / TIM',
    summary: '覆蓋在晶片上方的金屬蓋，把 GPU 熱量導向散熱器，同時保護晶片與抑制翹曲。',
    role: '散熱路徑（晶片 → TIM1 → 蓋板 → TIM2 → 冷板），並提供機械保護。部分 AI GPU 改為裸晶直接接觸冷板（lidless）。',
    specs: [
      { label: '蓋板材料', value: '鍍鎳銅' },
      { label: 'TIM1', value: '高導熱膏／銦片／金屬類 TIM', unverified: true },
      { label: '加強環', value: '載板周圍常加金屬 stiffener ring 控制翹曲' },
    ],
    materials: [],
  },
  {
    id: 'gpu',
    name: 'GPU 運算晶粒',
    nameEn: 'GPU / Compute Die',
    summary: 'AI 加速器的運算核心，前段晶圓製程在晶圓廠完成，以微凸塊接到中介層上。',
    role: '執行矩陣運算；與 HBM 之間透過中介層上的數千條高密度走線連接，取得 TB/s 等級頻寬。',
    specs: [
      { label: '製程', value: '台積電 4NP（NVIDIA Blackwell）' },
      {
        label: '晶粒尺寸',
        value: '接近光罩極限（約 800 mm²／顆），Blackwell 以 2 顆晶粒拼成一顆 GPU',
        unverified: true,
      },
      { label: '晶粒間互連', value: 'NV-HBI 10 TB/s（Blackwell）', unverified: true },
    ],
    materials: [],
    processChain: 'cowos',
  },
  {
    id: 'hbm',
    name: 'HBM 高頻寬記憶體堆疊',
    nameEn: 'HBM Stack',
    summary: '多顆 DRAM 晶粒以 TSV 垂直堆疊，最底層是 base (logic) die，緊貼 GPU 旁邊擺放。',
    role: '提供 GPU 高頻寬記憶體；因 I/O 數上千、走線極密，只能放在中介層上，無法走一般 PCB。',
    specs: [
      { label: '堆疊層數', value: '8-Hi / 12-Hi（HBM3E），HBM4 12–16-Hi', unverified: true },
      { label: 'B200 配置', value: '8 顆 HBM3E，共 192 GB', unverified: true },
      { label: '供應商', value: 'SK 海力士、三星、美光' },
      { label: 'HBM4 base die', value: '開始採用邏輯製程，可由台積電代工' },
    ],
    materials: [],
    processChain: 'cowos',
  },
  {
    id: 'ubump',
    name: '微凸塊 µBump',
    nameEn: 'Micro-bump',
    summary: 'GPU 與 HBM 底部的微小銅柱凸塊，把晶片接到中介層上（CoWoS 的「CoW」）。',
    role: '晶片 ↔ 中介層的訊號與電源連接；間距遠小於 C4，數量可達數十萬顆。',
    specs: [
      { label: '結構', value: '銅柱＋錫銀（SnAg）帽' },
      { label: '間距', value: '約 40–55 µm', unverified: true },
      { label: '下一代', value: '混合鍵結（Hybrid Bonding，SoIC）取消凸塊，銅對銅直接接合，間距 < 10 µm' },
    ],
    materials: [],
    processChain: 'cowos',
  },
  {
    id: 'interposer',
    name: '中介層',
    nameEn: 'Interposer',
    summary: 'CoWoS 的核心：一片承載 GPU 與 HBM 的「超高密度轉接板」，提供晶片之間的細線路。',
    role: '在晶片之間提供 µm 級細線路（ABF 載板做不到的密度），再把訊號往下扇出到 C4 凸塊。',
    specs: [{ label: '面積', value: '可達光罩面積的 3～5 倍以上（以光罩拼接製作）', unverified: true }],
    materials: [],
    processChain: 'cowos',
    variants: [
      {
        id: 'cowos-s',
        name: 'CoWoS-S',
        era: 'mainstream',
        palette: 'silicon',
        summary: '整片矽中介層，含 TSV 與 BEOL 細線路。線路最細，但大面積矽成本高、尺寸受限。',
        specs: [
          { label: '材料', value: '矽晶圓（含 TSV 矽穿孔）' },
          { label: '代表產品', value: 'NVIDIA H100 / H200、AMD MI300', unverified: true },
        ],
      },
      {
        id: 'cowos-r',
        name: 'CoWoS-R',
        era: 'mainstream',
        palette: 'organicRdl',
        summary: '以聚合物＋銅重佈線層（RDL）取代矽中介層，沒有 TSV。成本較低、可緩衝熱應力，但線寬較粗。',
        specs: [
          { label: '材料', value: '聚醯亞胺類介電層＋銅 RDL' },
          { label: '應用', value: '網通 ASIC、對線寬需求較低的晶片', unverified: true },
        ],
      },
      {
        id: 'cowos-l',
        name: 'CoWoS-L',
        era: 'mainstream',
        palette: 'organicRdl',
        summary: 'RDL 中介層內嵌小塊「局部矽橋」（LSI），只在晶片交界處用矽做細線路，兼顧大面積與高密度。',
        specs: [
          { label: '結構', value: 'RDL 中介層＋嵌入式 LSI 矽橋（可含 TSV）' },
          { label: '代表產品', value: 'NVIDIA Blackwell B200 / GB200、Rubin' },
        ],
      },
    ],
  },
  {
    id: 'c4',
    name: 'C4 凸塊＋底部填充膠',
    nameEn: 'C4 Bump / Underfill',
    summary: '中介層底部的錫凸塊，把整個 CoW 模組接到 ABF 載板上（CoWoS 的「oS」）。',
    role: '中介層 ↔ 載板的電性連接；底部填充膠（underfill）包覆凸塊，分散矽與有機載板之間熱膨脹差造成的應力。',
    specs: [
      { label: '全名', value: 'Controlled Collapse Chip Connection' },
      { label: '間距', value: '約 130–180 µm', unverified: true },
      { label: 'Underfill', value: '環氧樹脂＋二氧化矽填料' },
    ],
    materials: [],
    processChain: 'cowos',
  },
  {
    id: 'substrate',
    name: 'ABF 載板',
    nameEn: 'ABF Substrate (FC-BGA)',
    summary: '把中介層 C4 的細間距「扇出」到主機板 BGA 的粗間距，是晶片與 PCB 之間的橋樑。',
    role: '間距轉換（~150 µm → ~1 mm）、電源分配、訊號路由，同時是封裝的機械骨架。AI GPU 載板面積大、層數多，是 ABF 載板產能最吃緊的品項。',
    specs: [
      { label: '結構', value: '核心層＋上下對稱 ABF 增層（例：8-2-8 表示上 8 層、核心 2 層、下 8 層）' },
      { label: 'AI GPU 載板層數', value: '約 14–20+ 層', unverified: true },
      { label: '尺寸', value: '約 70×70 至 100×100 mm 以上', unverified: true },
      { label: '台廠', value: '欣興 3037、南電 8046、景碩 3189、臻鼎-KY 4958' },
      { label: '國際', value: '揖斐電 Ibiden、新光電氣、三星電機、AT&S' },
    ],
    materials: ['abf-film', 'glass-fabric', 'ccl', 'copper-foil'],
    microView: 'substrate-section',
    processChain: 'substrate',
    variants: [
      {
        id: 'organic-core',
        name: '有機核心（玻纖）',
        era: 'mainstream',
        palette: 'core',
        summary: '核心層為含 Low-CTE 玻纖布的樹脂基板，機械鑽孔做 PTH。目前量產主流。',
        specs: [
          { label: '核心材料', value: 'BT／類 BT 樹脂＋Low-CTE（T-glass）玻纖布' },
          { label: '痛點', value: '大尺寸載板翹曲、Low-CTE 玻纖布供應吃緊' },
        ],
      },
      {
        id: 'glass-core',
        name: '玻璃基板',
        era: 'next',
        palette: 'glassCore',
        summary:
          '以整片玻璃取代有機核心，雷射改質＋蝕刻做玻璃穿孔（TGV）。平整度、CTE 匹配與細線路佳，被視為下一代大尺寸 AI 載板方案。',
        specs: [
          { label: '核心材料', value: '無鹼玻璃板，玻璃穿孔 TGV' },
          { label: '時程', value: 'Intel、三星電機等規劃 2026–2030 導入', unverified: true },
          { label: '挑戰', value: '玻璃脆裂、TGV 金屬化可靠度、產業鏈尚未成熟' },
        ],
      },
    ],
  },
  {
    id: 'substrate-buildup',
    parent: 'substrate',
    name: 'ABF 增層',
    nameEn: 'ABF Build-up Layers',
    summary: '核心層上下一層層疊加的 ABF 絕緣膜＋銅線路，負責高密度佈線。',
    role: 'ABF 不含玻纖，表面平整，可用雷射鑽微盲孔並以 SAP 製程做出細線路。',
    specs: [
      { label: '介電材料', value: 'ABF（味之素增層膜）：環氧樹脂＋球形二氧化矽填料' },
      { label: '單層厚度', value: '約 15–40 µm', unverified: true },
      { label: '線寬／線距', value: 'SAP 製程約 8/8 µm 等級，持續微縮', unverified: true },
      { label: '層間導通', value: 'CO₂／UV 雷射微盲孔，可疊孔（stacked via）' },
    ],
    materials: ['abf-film', 'copper-foil'],
    microView: 'substrate-section',
    processChain: 'substrate',
  },
  {
    id: 'substrate-core',
    parent: 'substrate',
    name: '載板核心層',
    nameEn: 'Substrate Core',
    summary: '載板中間的剛性骨架，是含玻纖布的銅箔基板；玻纖布在這裡。',
    role: '提供剛性、控制熱膨脹（CTE）以抑制翹曲；以機械鑽孔＋電鍍形成 PTH 上下導通。',
    specs: [
      { label: '材料', value: 'Low-CTE 玻纖布（T-glass 類）＋BT／類 BT 樹脂' },
      { label: '厚度', value: '約 0.8–1.6 mm', unverified: true },
      { label: '貫孔', value: '機械鑽孔 PTH，電鍍後以樹脂塞孔' },
    ],
    materials: ['glass-fabric', 'ccl', 'resin', 'copper-foil'],
    microView: 'substrate-section',
    processChain: 'substrate',
  },
  {
    id: 'solder-mask',
    parent: 'substrate',
    name: '防焊層',
    nameEn: 'Solder Mask',
    summary: '載板最外層的絕緣保護漆，只在焊墊位置開窗。',
    role: '保護外層線路、防止焊錫橋接；開窗處做表面處理（如 ENEPIG）後接凸塊或錫球。',
    specs: [{ label: '材料', value: '感光型防焊油墨／防焊乾膜' }],
    materials: [],
    microView: 'substrate-section',
    processChain: 'substrate',
  },
  {
    id: 'bga',
    name: 'BGA 錫球',
    nameEn: 'BGA Solder Balls',
    summary: '載板底部的錫球陣列，把整顆封裝焊到主機板（或 GPU 模組板）上。',
    role: '封裝 ↔ PCB 的電性與機械連接；AI GPU 封裝錫球數可達數千顆。',
    specs: [
      { label: '材料', value: '錫銀銅（SAC）無鉛焊料' },
      { label: '球距', value: '約 0.8–1.0 mm', unverified: true },
    ],
    materials: [],
  },
  {
    id: 'server-pcb',
    name: 'PCB 主機板／GPU 模組板',
    nameEn: 'Server PCB / OAM Board',
    summary: '承載 GPU 封裝的高多層電路板，同樣由玻纖布＋樹脂＋銅箔構成的 CCL 一層層壓合而成。',
    role: '供電與高速訊號（PCIe、NVLink、224G SerDes）走線；AI 伺服器推動 CCL 往超低損耗等級（M7–M9）升級。',
    specs: [
      { label: '層數', value: 'GPU 模組／UBB 約 20–30+ 層', unverified: true },
      { label: '厚度', value: '約 2.4–4 mm', unverified: true },
      { label: 'CCL 等級', value: 'M7–M8 主流，往 M9 演進（Panasonic Megtron 分級）', unverified: true },
      { label: '玻纖布', value: 'Low-Dk 玻纖布，往石英布或無布化 PTFE 演進' },
      { label: '銅箔', value: 'HVLP 低粗糙度銅箔（降低高頻集膚效應損耗）' },
    ],
    materials: ['ccl', 'glass-fabric', 'copper-foil', 'resin', 'ptfe'],
    related: ['gpu-module'],
    microView: 'glass-fabric',
    processChain: 'laminate',
  },
];

export const LAYERS: StackLayer[] = [...FAB_LAYERS, ...PACKAGE_LAYERS, ...TEST_LAYERS, ...RACK_LAYERS];

export const sceneOfLayer = (layer: StackLayer): SceneKey => layer.scene ?? 'package';

export const LAYER_MAP = Object.fromEntries(LAYERS.map((l) => [l.id, l])) as Record<StackLayer['id'], StackLayer>;
