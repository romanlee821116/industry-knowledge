# 半導體產業 3D 知識庫

用可互動的 3D 模型拆解半導體產業鏈：從晶圓廠、CoWoS 封裝、測試到 AI 伺服器機櫃，點選任一零件即可看到它的工程知識，以及對應的台股族群與個股。

以**工程結構為骨、台股族群為索引**：先理解東西怎麼做、由哪些層組成，再對應到是哪些公司在供應。

## 功能

- **四大場景**：晶圓廠製程線、CoWoS 封裝堆疊、測試、伺服器機櫃，皆為 Blender 擬真建模
- **爆炸分解**：拉開各層結構，看清楚堆疊順序
- **技術版本切換**：例如 CoWoS-S／CoWoS-L、有機／玻璃核心載板、可插拔光模組／CPO
- **微觀切片**：6 個放大剖面
  - 玻纖布 → CCL
  - ABF 載板剖面
  - 晶片內部剖面（電晶體＋銅導線）
  - 探針接觸晶圓凸塊
  - 測試座 pogo pin 剖面
  - 800G 可插拔光模組內部
- **製程鏈**：從原料到成品的步驟說明（玻纖 → CCL → 電路板、載板、CoWoS、測試等）
- **族群索引**：8 大類、約 100 個細族群、143 檔台股，每檔標示角色與核心程度（1–3），並附國際主要廠商

## 資料查證原則

所有個股都必須上網查證後才收錄，結果放在 [`web/src/features/sectors/data/verified/`](web/src/features/sectors/data/verified/)，每筆都附來源。

- 原始清單有誤的，記錄「原值 → 修正值」與理由（`verdict: corrected`）
- 不屬於該族群的標的會移除（`verdict: removed`），不會悄悄刪掉
- 數據還沒找到可靠來源的，介面上會標示「待確認」

> 本專案用於工程與產業學習，不構成任何投資建議。

## 專案結構

```
industry-knowledge/
├── web/                     # Next.js 前端
│   ├── public/models/       # Blender 產出的 GLB 模型
│   └── src/features/
│       ├── explorer/        # 主介面：場景切換、側欄、知識卡、搜尋
│       ├── stack/           # 3D 場景、各層知識、微觀切片、製程鏈
│       └── sectors/         # 族群目錄與查證後的個股資料
└── blender/                 # 以 Python 腳本產生 3D 模型
```

## 技術

| 項目     | 使用                                                     |
| -------- | -------------------------------------------------------- |
| 前端     | Next.js 16、React 19、TypeScript                         |
| 3D       | three.js、React Three Fiber、drei、postprocessing        |
| UI／狀態 | Ant Design、Tailwind CSS 4、Zustand                      |
| 建模     | Blender Python（`bpy`），輸出 GLB＋層級 metadata JSON |

## 本機開發

```bash
cd web
npm install
npm run dev
```

開啟 http://localhost:3000

## 重新產生 3D 模型

模型已經放在 `web/public/models/`，平常開發不需要裝 Blender。修改 `blender/` 底下的腳本後才需要重新產生。

整體場景會同時輸出 GLB 與 metadata（各層的中心點、尺寸，供鏡頭對焦與標籤定位用）：

```bash
cd blender
blender --background --python package_scene.py -- \
  ../web/public/models/package_scene.glb \
  ../web/src/features/stack/data/generated/package-scene.meta.json
```

`fab_scene.py`、`test_scene.py`、`rack_scene.py` 用法相同。

微觀切片只輸出 GLB：

```bash
blender --background --python chip_section.py -- ../web/public/models/chip_section.glb
```

快速渲染預覽圖，檢查模型外觀：

```bash
blender --background --python preview.py -- <in.glb> <out.png> [方位角] [仰角]
```

### Mesh 命名規則

前端依 mesh 名稱決定互動行為：

```
<layerId>__<part>[__e<k>][__v<variant>]
```

- `layerId`：對應到知識卡與高亮群組
- `__e<k>`：爆炸分解時往上抬 k 層
- `__v<id>`：只在該技術版本啟用時顯示（例如 `cowos-l`、`glass-core`、`cpo`）
- 名稱不含 `__` 的是裝飾物件（例如地板），不可點選

## 新增族群或個股

1. 上網查證，結果寫進 `sectors/data/verified/batch-*.json`（附來源）
2. 在 `sectors/data/catalog.ts` 加上族群定義，並用 `anchors` 對應到 3D 模型的層
3. 需要放大說明時，在 `blender/` 加微觀模型，並登錄到 `stack/data/micro-views.ts`
