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
];

export const MATERIAL_MAP = Object.fromEntries(MATERIALS.map((m) => [m.id, m])) as Record<Material['id'], Material>;
