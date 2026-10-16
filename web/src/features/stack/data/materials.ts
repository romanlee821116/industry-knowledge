import type { Material } from '../types';

export const MATERIALS: Material[] = [
  {
    id: 'glass-fabric',
    name: '玻纖布',
    nameEn: 'Glass Fabric',
    summary:
      '熔融玻璃拉成數微米的玻璃纖維，集束成紗後平織成布。是 CCL／PCB 與載板核心層的「鋼筋」，決定板材的剛性、熱膨脹與介電特性。',
    specs: [
      { label: '單絲直徑', value: '約 4–9 µm（越薄的布用越細的絲）', unverified: true },
      { label: '常見型號（IPC）', value: '7628、2116、1080、1078、1037、1027、1017（數字越小越薄）' },
      { label: '厚度範圍', value: '7628 約 170 µm；1017 約 15 µm', unverified: true },
      { label: '織法', value: '平織（經紗 × 緯紗交錯），薄布需開纖讓樹脂均勻含浸' },
      { label: '台廠', value: '台玻 1802、富喬 1815、建榮 5340、德宏 5475、南亞 1303' },
      { label: '國際', value: '日東紡 Nittobo（Low-CTE／Low-Dk 高階布主要供應商）、旭化成' },
    ],
    usedIn: ['substrate-core', 'server-pcb'],
    microView: 'glass-fabric',
    processChain: 'laminate',
    variants: [
      {
        id: 'e-glass',
        name: 'E-glass',
        era: 'legacy',
        palette: 'glass',
        summary: '一般電子級玻纖，成本最低，用於消費性與一般 PCB。',
        specs: [
          { label: 'Dk', value: '約 6.6', unverified: true },
          { label: 'CTE', value: '約 5.5 ppm/°C', unverified: true },
        ],
      },
      {
        id: 'low-dk',
        name: 'Low-Dk（一代／二代）',
        era: 'mainstream',
        palette: 'glass',
        summary: '降低介電常數與損耗，用於 AI 伺服器、800G 交換器等高速 CCL。',
        specs: [
          { label: 'Dk', value: '約 4.4–4.8（一代）、更低（二代）', unverified: true },
          { label: '應用', value: 'M7–M8 高速 CCL、AI 伺服器 GPU 板' },
        ],
      },
      {
        id: 'low-cte',
        name: 'Low-CTE（T-glass）',
        era: 'mainstream',
        palette: 'glass',
        summary:
          '高模數、低熱膨脹，用於 ABF／BT 載板核心層，抑制大尺寸載板翹曲。AI 載板放大後需求激增，供應集中於日東紡。',
        specs: [
          { label: 'CTE', value: '約 2.8 ppm/°C', unverified: true },
          { label: '應用', value: 'ABF 載板核心、BT 載板' },
        ],
      },
      {
        id: 'quartz',
        name: '石英布（Q-glass）',
        era: 'next',
        palette: 'glass',
        summary:
          '以高純度石英纖維織成，Dk／Df 最低，是 M9 等級、1.6T 交換器與下一代 AI 伺服器的候選材料，但加工難、成本高。',
        specs: [
          { label: 'Dk', value: '約 3.7–3.8', unverified: true },
          { label: 'Df', value: '約 0.0001–0.0005', unverified: true },
          { label: '挑戰', value: '鑽孔磨耗大、價格為 Low-Dk 數倍' },
        ],
      },
    ],
  },
  {
    id: 'ccl',
    name: 'CCL 銅箔基板',
    nameEn: 'Copper Clad Laminate',
    summary: '玻纖布含浸樹脂成為 PP（半固化片），再與銅箔疊合熱壓而成。PCB 與載板核心層的母材。',
    specs: [
      { label: '組成', value: '玻纖布＋樹脂（＋填料）＋銅箔' },
      { label: '高速等級', value: 'Megtron 分級 M4 → M6 → M7 → M8 → M9，損耗（Df）逐級降低', unverified: true },
      { label: '載板用', value: 'BT 樹脂系（三菱瓦斯主導）、Low-CTE 基材' },
      { label: '台廠', value: '台光電 2383、台燿 6274、聯茂 6213、南亞 1303' },
      { label: '國際', value: '松下 Panasonic、斗山 Doosan、生益科技、三菱瓦斯 MGC' },
    ],
    usedIn: ['substrate-core', 'server-pcb'],
    microView: 'glass-fabric',
    processChain: 'laminate',
  },
  {
    id: 'abf-film',
    name: 'ABF 增層膜',
    nameEn: 'Ajinomoto Build-up Film',
    summary: '味之素開發的環氧樹脂系絕緣薄膜，不含玻纖，可雷射鑽孔並做細線路。由味之素供應，載板廠用它做成 ABF 載板。',
    specs: [
      { label: '組成', value: '環氧樹脂＋大量球形二氧化矽填料' },
      { label: '供應', value: '味之素 Ajinomoto，全球市占逾九成' },
      { label: '台股相關', value: '中美晶 5483（旗下晶化科技增層膜小量出貨）' },
    ],
    usedIn: ['substrate-buildup'],
    microView: 'substrate-section',
    processChain: 'substrate',
  },
  {
    id: 'copper-foil',
    name: '銅箔',
    nameEn: 'Copper Foil',
    summary: '電解銅箔壓合在 CCL 表面成為導體層。高頻時電流集中在表面（集膚效應），因此高速板要求低粗糙度。',
    specs: [
      { label: '高速板', value: 'HVLP（極低輪廓）銅箔，HVLP1 → HVLP4 粗糙度遞減' },
      { label: '載板／mSAP', value: '附載體極薄銅箔（數 µm）', unverified: true },
      { label: '台廠', value: '金居 8358、南亞 1303；長春（未上市）' },
      { label: '國際', value: '三井金屬、古河電工、日本電解' },
    ],
    usedIn: ['substrate-core', 'substrate-buildup', 'server-pcb'],
    processChain: 'laminate',
  },
  {
    id: 'resin',
    name: '樹脂',
    nameEn: 'Resin System',
    summary: '含浸玻纖布、黏合各層的高分子。樹脂種類決定 CCL 的耐熱（Tg）與介電損耗。',
    specs: [
      { label: '一般 FR-4', value: '環氧樹脂' },
      { label: '高速 CCL', value: 'PPO／PPE、碳氫樹脂、BMI' },
      { label: '載板核心', value: 'BT 樹脂（三菱瓦斯）' },
      { label: '台股', value: '國精化 4722、崇舜 7763、雙鍵 4764、三晃 1721、上緯投控 3708、南亞 1303' },
    ],
    usedIn: ['substrate-core', 'server-pcb'],
    processChain: 'laminate',
  },
  {
    id: 'ptfe',
    name: 'PTFE 低損耗材料',
    nameEn: 'PTFE (Polytetrafluoroethylene)',
    summary:
      '聚四氟乙烯（俗稱鐵氟龍），介電常數與損耗是常用板材中最低的一群。過去用在雷達、基地台等射頻板；AI 伺服器走向 224G 以上 SerDes 後，被拉進高速 CCL，作為取代「M9 樹脂＋石英布」的方案。',
    specs: [
      { label: 'Dk／Df（純 PTFE）', value: '約 2.1／0.0002–0.0004', unverified: true },
      { label: 'Dk／Df（陶瓷填充，如 Rogers RO3003）', value: '3.00／0.0010（10 GHz）' },
      {
        label: '為何低損耗',
        value: 'C–F 鍵極性低且分子結構對稱，電場下幾乎不產生偶極轉向損耗；不吸濕，介電特性隨溫濕度變化小',
      },
      {
        label: '無布化的好處',
        value: '以二氧化矽填料取代玻纖布，避免玻纖與樹脂交界的介電不均（編織效應），訊號延遲與損耗更一致',
      },
      {
        label: '加工難點',
        value:
          '材質軟、CTE 大、化學惰性使孔壁難以化學鍍銅（需電漿或鈉萘處理）；與一般板材混層壓合時需加接著層，良率是放量關鍵',
      },
      { label: '台股', value: '台虹 8039（無玻纖 PTFE CCL 驗證中）、台光電 2383（二供認證中）' },
      { label: '國際', value: '生益科技（PTFE CCL 主供候選）、Rogers、大金（PTFE 樹脂）' },
    ],
    usedIn: ['server-pcb', 'nvlink-spine'],
    processChain: 'laminate',
    variants: [
      {
        id: 'ptfe-glass',
        name: '玻纖補強 PTFE',
        era: 'legacy',
        summary: 'PTFE 含浸玻纖布，傳統微波／射頻板（基地台天線、雷達），層數少、單價高。',
        specs: [{ label: '應用', value: '5G 基地台、車用雷達、衛星通訊' }],
      },
      {
        id: 'ptfe-ceramic',
        name: '陶瓷填充 PTFE',
        era: 'mainstream',
        summary: '加入陶瓷粉降低 CTE、穩定 Dk，是目前高頻射頻板主流（例如 Rogers RO3000 系列）。',
        specs: [{ label: '代表料號', value: 'Rogers RO3003：Dk 3.00、Df 0.0010' }],
      },
      {
        id: 'ptfe-glassless',
        name: '無布化 PTFE＋二氧化矽填料 CCL',
        era: 'next',
        summary:
          '完全不用玻纖布的 PTFE 覆銅板，供應鏈報導為 NVIDIA Rubin Ultra 正交背板（78–108 層）的候選材料，可能與 M9＋石英布混層壓合；最終設計與供應比重尚未由官方證實。',
        specs: [
          { label: '目標速率', value: 'PCIe Gen7、NVLink 6，單通道 337G 以上', unverified: true },
          { label: '時程', value: '台虹規劃 2027 年初月產 10 萬張，普及預期 2028 年後' },
        ],
      },
    ],
  },
];

export const MATERIAL_MAP = Object.fromEntries(MATERIALS.map((m) => [m.id, m])) as Record<Material['id'], Material>;
