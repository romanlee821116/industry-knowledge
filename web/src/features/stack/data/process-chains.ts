import type { ProcessChain, ProcessChainId } from '../types';

export const PROCESS_CHAINS: Record<ProcessChainId, ProcessChain> = {
  laminate: {
    id: 'laminate',
    name: '玻纖 → CCL → 電路板',
    steps: [
      {
        title: '玻璃熔融',
        description: '矽砂、硼、鋁等原料於窯爐熔融成玻璃液；配方決定 E-glass／Low-Dk／Low-CTE 等級。',
      },
      {
        title: '拉絲成紗',
        description: '玻璃液經鉑銠合金漏板拉成數微米單絲，數百根集束成紗。',
        produces: ['glass-fabric'],
      },
      { title: '整經／織布', description: '經紗與緯紗以噴氣織機平織成玻纖布。', produces: ['glass-fabric'] },
      {
        title: '退漿／表面處理',
        description: '去除紡織漿料，塗佈矽烷偶聯劑，讓玻璃與樹脂牢固結合；薄布做開纖處理。',
        produces: ['glass-fabric'],
      },
      {
        title: '含浸成 PP',
        description: '玻纖布浸入樹脂後烘乾至半固化（B-stage），成為 PP（prepreg）。',
        produces: ['resin'],
      },
      {
        title: '疊銅箔壓合',
        description: 'PP 與銅箔疊合，高溫高壓壓合成 CCL 銅箔基板。',
        produces: ['ccl', 'copper-foil'],
      },
      {
        title: '製成 PCB／載板核心',
        description: 'PCB 廠做內層線路並多層壓合、鑽孔電鍍成主機板；載板廠以 Low-CTE CCL 為核心板繼續增層。',
        produces: ['server-pcb', 'substrate-core'],
      },
    ],
  },
  substrate: {
    id: 'substrate',
    name: 'ABF 載板製程（SAP）',
    steps: [
      {
        title: '核心板',
        description: '以 Low-CTE 玻纖布 CCL 作為核心板。',
        produces: ['substrate-core', 'glass-fabric', 'ccl'],
      },
      {
        title: '鑽孔＋電鍍 PTH',
        description: '機械鑽孔後化學銅＋電鍍，形成上下導通的貫孔。',
        produces: ['substrate-core'],
      },
      { title: '塞孔＋研磨', description: '以樹脂填滿 PTH 並磨平，讓上方可直接疊盲孔。', produces: ['substrate-core'] },
      { title: '核心線路', description: '核心板兩面銅層曝光蝕刻出線路。', produces: ['substrate-core'] },
      {
        title: 'ABF 真空壓膜',
        description: '在兩面貼上 ABF 增層膜並熱固化。',
        produces: ['substrate-buildup', 'abf-film'],
      },
      {
        title: '雷射鑽微盲孔',
        description: 'CO₂／UV 雷射打出微盲孔，除膠渣後粗化表面。',
        produces: ['substrate-buildup'],
      },
      {
        title: 'SAP 細線路',
        description: '化學銅種子層 → 乾膜曝光 → 電鍍銅 → 去膜 → 閃蝕，形成細線路與填孔。',
        produces: ['substrate-buildup'],
      },
      {
        title: '重複增層',
        description: '重複壓膜／雷射／SAP，直到達到所需層數（AI 載板上下各 7–10 層）。',
        produces: ['substrate-buildup'],
      },
      { title: '防焊＋表面處理', description: '塗佈防焊並開窗，焊墊做 ENEPIG 等表面處理。', produces: ['solder-mask'] },
      {
        title: '電測／成型出貨',
        description: '電性測試、AOI 檢查、切割成型，出貨給封裝廠做 CoWoS 的 oS 段。',
        produces: ['substrate'],
      },
    ],
  },
  cowos: {
    id: 'cowos',
    name: 'CoWoS 封裝流程',
    steps: [
      {
        title: '晶圓前段',
        description: 'GPU 在台積電先進製程完成；HBM 由記憶體廠堆疊完成後送來。',
        produces: ['gpu', 'hbm'],
      },
      {
        title: '中介層製作',
        description: '矽中介層做 TSV 與細線路；CoWoS-R/L 則做 RDL（L 另嵌入 LSI 矽橋）。',
        produces: ['interposer'],
      },
      {
        title: 'CoW：晶片上中介層',
        description: 'GPU 與 HBM 以微凸塊接合到中介層晶圓，填膠／封模。',
        produces: ['ubump', 'gpu', 'hbm'],
      },
      {
        title: '薄化＋C4 凸塊',
        description: '中介層背面薄化露出 TSV，製作 C4 凸塊後切割。',
        produces: ['c4', 'interposer'],
      },
      { title: 'oS：接合到載板', description: 'CoW 模組接合到 ABF 載板，底部填膠。', produces: ['c4', 'substrate'] },
      { title: '蓋板＋植球', description: '加上蓋板／加強環與 TIM，載板底部植 BGA 錫球。', produces: ['lid', 'bga'] },
      {
        title: '最終測試',
        description: '成品測試、預燒（burn-in）後出貨給模組／伺服器廠上板。',
        produces: ['server-pcb'],
      },
    ],
  },
  test: {
    id: 'test',
    name: '晶片測試流程',
    steps: [
      {
        title: 'CP 晶圓測試',
        description: '探針台把晶圓送到探針卡下方，探針壓在凸塊上，ATE 逐顆量測並標記不良晶粒。',
        produces: [
          'wafer',
          'probe-head',
          'space-transformer',
          'probe-card-pcb',
          'prober-chuck',
          'pogo-tower',
          'ate-head',
        ],
      },
      {
        title: '切割取 KGD',
        description: '只挑良好晶粒（KGD）進入 CoWoS 封裝，避免一顆壞晶粒報廢整個模組。',
        produces: ['wafer'],
      },
      {
        title: 'CoWoS 封裝',
        description: 'CoW 接合中介層、oS 接到 ABF 載板（見封裝場景）。',
        produces: ['dut-package'],
      },
      {
        title: 'FT 成品測試',
        description: '分類機把封裝放進測試座、ATE 透過測試載板量測功能與速度分級。',
        produces: ['dut-package', 'test-socket', 'load-board', 'handler', 'ate-head'],
      },
      { title: 'Burn-in 預燒', description: '高溫高壓長時間運轉，篩掉早期失效品。', produces: ['dut-package'] },
      {
        title: 'SLT 系統級測試',
        description: '在接近實際系統的板子上跑真實工作負載，抓出 ATE 測不到的缺陷。',
        produces: ['dut-package'],
      },
    ],
  },
  fab: {
    id: 'fab',
    name: '前段晶圓製程循環',
    steps: [
      {
        title: '矽晶圓投片',
        description: '12 吋晶圓裝在 FOUP 中，由天車送進產線。',
        produces: ['fab-wafer', 'foup', 'amhs'],
      },
      { title: '清洗', description: '去除微粒與污染物，每道製程前後都要做。', produces: ['wet-bench', 'chem-supply'] },
      {
        title: '薄膜沉積',
        description: '以 PVD／CVD／ALD 長出絕緣層、阻障層或金屬層。',
        produces: [
          'deposition-tool',
          'pvd-chamber',
          'sputter-target',
          'cvd-chamber',
          'ald-chamber',
          'gas-cabinet',
          'vacuum-pump',
        ],
      },
      { title: '塗佈光阻', description: '旋轉塗佈光阻並烘烤。', produces: ['coater-track'] },
      {
        title: '曝光',
        description: '曝光機把光罩圖形縮小投影到光阻上（關鍵層用 EUV）。',
        produces: ['litho-scanner', 'reticle', 'pellicle'],
      },
      { title: '顯影', description: '洗掉曝光（或未曝光）區域的光阻，留下圖形。', produces: ['coater-track'] },
      {
        title: '蝕刻',
        description: '電漿把沒有光阻保護的薄膜吃掉，圖形轉印到材料上。',
        produces: ['etch-tool', 'gas-cabinet', 'vacuum-pump'],
      },
      { title: '去光阻＋清洗', description: '灰化去除殘餘光阻，再清洗。', produces: ['wet-bench'] },
      {
        title: 'CMP 平坦化',
        description: '研磨掉多餘材料（例如鑲嵌製程多鍍的銅），讓表面平整。',
        produces: ['cmp-tool', 'cmp-pad', 'cmp-slurry', 'pad-conditioner'],
      },
      {
        title: '檢測量測',
        description: '量測線寬、膜厚、缺陷後回到循環起點，重複數十至上百次。',
        produces: ['inspection-tool', 'process-flow'],
      },
      {
        title: '晶圓完成 → CP 測試',
        description: '完成所有導線層與凸塊後，送去晶圓測試（見測試場景）。',
        produces: ['fab-wafer'],
      },
    ],
  },
};
