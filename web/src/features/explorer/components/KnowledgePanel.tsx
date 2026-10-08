import { CloseOutlined, ExperimentOutlined } from '@ant-design/icons';
import { Button, Segmented, Steps, Tag } from 'antd';
import type { ReactNode } from 'react';

import type { SectorGroup } from '@/features/sectors';
import type { MicroViewId, SceneKey, Spec } from '@/features/stack';
import { cn } from '@/shared/lib/cn';

import type { ChainView, LinkItem, PanelCard, Selection, VariantSlot, VariantView } from '../types';
import { CompanyList } from './CompanyList';

interface Props {
  card: PanelCard;
  onNavigate: (item: Selection) => void;
  onVariantChange: (slot: VariantSlot, value: string) => void;
  onOpenMicro: (id: MicroViewId) => void;
  onClose: () => void;
}

const ERA_LABEL = { mainstream: '主流', next: '下一代', legacy: '傳統' } as const;

const OVERVIEW: Record<SceneKey, { title: string; intro: string; tips: string[] }> = {
  fab: {
    title: '晶圓廠製程線（前段）',
    intro:
      '一片 12 吋晶圓沿著地上的循環路線，在清洗 → 沉積 → 塗佈光阻 → 曝光 → 蝕刻 → CMP → 檢測之間反覆跑數十到上百輪，一層層做出電晶體與銅導線；天花板的天車負責搬運 FOUP。',
    tips: [
      '點「矽晶圓」可開啟晶片內部剖面，看每道製程做出了哪一層',
      '每座機台上方可拆出關鍵耗材：濺鍍靶材、光罩與保護膜、CMP 研磨墊與鑽石碟',
      '左側「半導體設備」「半導體材料」族群可直接定位到對應機台',
      '前段主機台多由 AMAT、Lam、TEL、ASML、KLA 寡占，台廠多在耗材、廠務與先進封裝設備',
    ],
  },
  package: {
    title: 'CoWoS AI GPU 封裝全堆疊',
    intro: '由下而上：PCB 主機板 → BGA 錫球 → ABF 載板 → C4 凸塊 → 中介層 → 微凸塊 → GPU＋HBM → 蓋板。',
    tips: [
      '點擊 3D 模型任一層，查看功能、規格、材料與相關族群',
      '左側族群索引：點族群會高亮它在堆疊中的位置並列出個股',
      '拖動「爆炸分解」把堆疊拉開；開啟「剖面」看橫截面',
      '載板、玻纖布可開啟微觀切片與製程鏈',
    ],
  },
  rack: {
    title: 'AI 伺服器機櫃',
    intro:
      '由下而上：電源櫃 → 運算托盤 ×2 → NVLink 交換托盤 ×2 → 運算托盤 ×2 → 電源櫃 → Scale-out 交換器。後方是 NVLink 銅纜背板與液冷分歧管，頂部交換器的光模組與光纖把機櫃連成 GPU 叢集。',
    tips: [
      '點「GPU 模組」→「其他場景的相關結構」可直接跳到封裝場景看 GPU 內部',
      '點「高速交換器」可切換「可插拔光模組／CPO 共同封裝光學」比較兩種架構',
      '點「光收發模組」開啟微觀切片，看雷射、DSP、透鏡與光纖',
      '左側「光通訊」「電源／功率半導體」「AI／HPC」族群可直接定位',
    ],
  },
  test: {
    title: 'AI 晶片測試：CP 與 FT',
    intro:
      '左側 CP 晶圓測試：ATE 測試頭 → Pogo Tower → 探針卡（PCB／空間轉換板／探針頭）→ 晶圓 → 探針台。右側 FT 成品測試：分類機壓測頭 → 封裝 → 測試座 → 測試載板 → ATE 測試頭。',
    tips: [
      'CoWoS 把多顆晶粒封在一起，一顆壞就整組報廢，所以封裝前的 CP 測試越來越重要',
      '探針頭、測試座可開啟微觀切片，看探針如何接觸凸塊、pogo pin 內部結構',
      '左側「測試」「半導體設備」族群可直接定位到對應零件',
    ],
  },
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-slate-800 px-4 py-3">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{title}</h3>
      {children}
    </section>
  );
}

function SpecList({ specs }: { specs: Spec[] }) {
  return (
    <dl className="space-y-1.5 text-xs">
      {specs.map((s) => (
        <div key={s.label} className="grid grid-cols-[96px_1fr] gap-2">
          <dt className="text-slate-500">{s.label}</dt>
          <dd className="leading-relaxed text-slate-300">
            {s.value}
            {s.unverified && (
              <Tag color="orange" className="ml-1.5 scale-90">
                待確認
              </Tag>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Chips({ items, onNavigate }: { items: LinkItem[]; onNavigate: Props['onNavigate'] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((l) => (
        <button
          key={`${l.kind}:${l.id}`}
          type="button"
          onClick={() => onNavigate({ kind: l.kind, id: l.id })}
          className="cursor-pointer rounded border border-slate-700 px-2 py-0.5 text-xs text-slate-300 hover:border-amber-400 hover:text-amber-300"
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

function SectorChips({ sectors, onNavigate }: { sectors: SectorGroup[]; onNavigate: Props['onNavigate'] }) {
  return (
    <Chips
      items={sectors.map((g) => ({
        kind: 'sector',
        id: g.id,
        label: `${g.name}（${g.companies.length}）`,
      }))}
      onNavigate={onNavigate}
    />
  );
}

function VariantBlock({ variant, onChange }: { variant: VariantView; onChange: Props['onVariantChange'] }) {
  return (
    <Section title="技術版本">
      <Segmented
        block
        size="small"
        value={variant.value}
        onChange={(v) => onChange(variant.slot, String(v))}
        options={variant.options.map((o) => ({ value: o.id, label: o.name }))}
      />
      <div className="mt-3 rounded-md bg-slate-900 p-3">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-sm font-medium text-slate-100">{variant.current.name}</span>
          <Tag
            color={variant.current.era === 'next' ? 'purple' : variant.current.era === 'legacy' ? 'default' : 'cyan'}
          >
            {ERA_LABEL[variant.current.era]}
          </Tag>
        </div>
        <p className="mb-2 text-xs leading-relaxed text-slate-400">{variant.current.summary}</p>
        <SpecList specs={variant.current.specs} />
      </div>
    </Section>
  );
}

function ChainBlock({ chain }: { chain: ChainView }) {
  return (
    <Section title={`製程鏈：${chain.chain.name}`}>
      <Steps
        orientation="vertical"
        size="small"
        type="dot"
        current={-1}
        items={chain.chain.steps.map((s, i) => {
          const active = chain.activeSteps.includes(i);
          return {
            status: active ? 'process' : 'wait',
            title: (
              <span className={cn('text-xs', active ? 'font-semibold text-amber-300' : 'text-slate-300')}>
                {s.title}
              </span>
            ),
            content: <span className="text-[11px] leading-relaxed text-slate-500">{s.description}</span>,
          };
        })}
      />
    </Section>
  );
}

function Header({ kicker, title, sub, onClose }: { kicker: string; title: string; sub?: string; onClose: () => void }) {
  return (
    <header className="flex items-start gap-2 px-4 pb-3 pt-4">
      <div className="flex-1">
        <p className="text-[11px] text-amber-400/80">{kicker}</p>
        <h2 className="text-lg font-semibold text-slate-50">{title}</h2>
        {sub && <p className="text-xs text-slate-500">{sub}</p>}
      </div>
      <Button type="text" size="small" icon={<CloseOutlined />} onClick={onClose} aria-label="關閉" />
    </header>
  );
}

function MicroButton({ id, onOpen }: { id?: MicroViewId; onOpen: Props['onOpenMicro'] }) {
  if (!id) return null;
  return (
    <div className="px-4 pb-3">
      <Button block icon={<ExperimentOutlined />} onClick={() => onOpen(id)}>
        開啟微觀切片
      </Button>
    </div>
  );
}

export function KnowledgePanel({ card, onNavigate, onVariantChange, onOpenMicro, onClose }: Props) {
  if (card.kind === 'overview') {
    const o = OVERVIEW[card.scene];
    return (
      <div className="space-y-3 p-5 text-sm leading-relaxed text-slate-400">
        <h2 className="text-lg font-semibold text-slate-100">{o.title}</h2>
        <p>{o.intro}</p>
        <ul className="list-disc space-y-1 pl-5 text-xs">
          {o.tips.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <p className="text-xs text-slate-500">標示「待確認」的數值尚未對照一手資料。</p>
      </div>
    );
  }

  if (card.kind === 'layer') {
    const { layer } = card;
    return (
      <div>
        <Header kicker={layer.parent ? '子結構' : '結構層'} title={layer.name} sub={layer.nameEn} onClose={onClose} />
        <div className="space-y-2 px-4 pb-3 text-sm leading-relaxed">
          <p className="text-slate-300">{layer.summary}</p>
          <p className="text-xs text-slate-400">{layer.role}</p>
        </div>
        <MicroButton id={card.microView} onOpen={onOpenMicro} />
        {card.variant && <VariantBlock variant={card.variant} onChange={onVariantChange} />}
        <Section title="規格">
          <SpecList specs={layer.specs} />
        </Section>
        {(card.parent || card.children.length > 0) && (
          <Section title="結構關係">
            <Chips items={[...(card.parent ? [card.parent] : []), ...card.children]} onNavigate={onNavigate} />
          </Section>
        )}
        {card.related.length > 0 && (
          <Section title="其他場景的相關結構">
            <Chips items={card.related} onNavigate={onNavigate} />
          </Section>
        )}
        {card.materials.length > 0 && (
          <Section title="使用材料">
            <Chips items={card.materials} onNavigate={onNavigate} />
          </Section>
        )}
        {card.sectors.length > 0 && (
          <Section title="相關族群">
            <SectorChips sectors={card.sectors} onNavigate={onNavigate} />
          </Section>
        )}
        {card.chain && <ChainBlock chain={card.chain} />}
      </div>
    );
  }

  if (card.kind === 'material') {
    const { material } = card;
    return (
      <div>
        <Header kicker="材料" title={material.name} sub={material.nameEn} onClose={onClose} />
        <p className="px-4 pb-3 text-sm leading-relaxed text-slate-300">{material.summary}</p>
        <MicroButton id={card.microView} onOpen={onOpenMicro} />
        {card.variant && <VariantBlock variant={card.variant} onChange={onVariantChange} />}
        <Section title="規格">
          <SpecList specs={material.specs} />
        </Section>
        <Section title="出現在堆疊哪裡">
          <Chips items={card.usedIn} onNavigate={onNavigate} />
        </Section>
        {card.sectors.length > 0 && (
          <Section title="相關族群">
            <SectorChips sectors={card.sectors} onNavigate={onNavigate} />
          </Section>
        )}
        {card.chain && <ChainBlock chain={card.chain} />}
      </div>
    );
  }

  if (card.kind === 'sector') {
    const { group } = card;
    return (
      <div>
        <Header kicker={`族群・${card.categoryName}`} title={group.name} onClose={onClose} />
        {group.summary && <p className="px-4 pb-3 text-sm leading-relaxed text-slate-300">{group.summary}</p>}
        {group.engineeringNotes && (
          <Section title="工程說明">
            <p className="text-xs leading-relaxed text-slate-400">{group.engineeringNotes}</p>
          </Section>
        )}
        <Section title="3D 位置">
          {card.anchors.length > 0 ? (
            <Chips items={card.anchors} onNavigate={onNavigate} />
          ) : (
            <p className="text-xs text-slate-500">尚未建模：此族群位於「{card.sceneLabel}」場景，之後的版本會加入。</p>
          )}
        </Section>
        <Section title="個股">
          {group.status === 'pending' ? (
            <p className="text-xs text-slate-500">尚未查證。依規則，個股須經公開資料查證後才會進資料庫。</p>
          ) : (
            <CompanyList
              companies={group.companies}
              onSelectCompany={(ticker) => onNavigate({ kind: 'company', id: ticker })}
            />
          )}
        </Section>
        {group.globalPlayers.length > 0 && (
          <Section title="國際主要廠商">
            <ul className="space-y-1.5 text-xs">
              {group.globalPlayers.map((p) => (
                <li key={p.name}>
                  <span className="text-slate-200">{p.name}</span>
                  <span className="ml-1 text-slate-600">{p.country}</span>
                  <p className="text-slate-400">{p.role}</p>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    );
  }

  const { company } = card;
  return (
    <div>
      <Header kicker="個股" title={company.name} sub={company.ticker} onClose={onClose} />
      <Section title="所屬族群與角色">
        <ul className="space-y-2.5">
          {company.memberships.map((m) => (
            <li key={m.groupId}>
              <button
                type="button"
                onClick={() => onNavigate({ kind: 'sector', id: m.groupId })}
                className="cursor-pointer text-sm text-slate-100 hover:text-amber-300"
              >
                {m.groupName}
                <span className="ml-2 text-amber-400">{'★'.repeat(m.core)}</span>
              </button>
              <p className="text-xs leading-relaxed text-slate-400">{m.role}</p>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
