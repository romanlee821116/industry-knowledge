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
};
