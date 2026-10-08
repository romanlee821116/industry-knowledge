import { LinkOutlined } from '@ant-design/icons';
import { Collapse, Tag, Tooltip } from 'antd';

import type { Company, Verdict } from '@/features/sectors';

const VERDICT: Record<Verdict, { label: string; color: string }> = {
  confirmed: { label: '已確認', color: 'green' },
  added: { label: '查證新增', color: 'blue' },
  corrected: { label: '已修正', color: 'gold' },
  unverified: { label: '待確認', color: 'default' },
  removed: { label: '已移除', color: 'red' },
};

function Stars({ core }: { core: number }) {
  return (
    <span className="text-amber-400" aria-label={`核心程度 ${core}`}>
      {'★'.repeat(core)}
      <span className="text-slate-700">{'★'.repeat(3 - core)}</span>
    </span>
  );
}

function CompanyRow({ c, onSelect }: { c: Company; onSelect: (ticker: string) => void }) {
  const v = VERDICT[c.verdict];
  return (
    <li className="border-b border-slate-800/80 py-2 last:border-0">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSelect(c.ticker)}
          className="cursor-pointer text-sm font-medium text-slate-100 hover:text-amber-300"
        >
          {c.name}
          <span className="ml-1 font-mono text-xs text-slate-500">{c.ticker}</span>
        </button>
        <Stars core={c.core} />
        <Tag color={v.color} className="ml-auto mr-0">
          {v.label}
        </Tag>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-slate-400">{c.role}</p>
      {c.note && <p className="mt-1 text-xs leading-relaxed text-amber-200/80">{c.note}</p>}
      {c.sources.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-2">
          {c.sources.map((url, i) => (
            <Tooltip key={url} title={url}>
              <a href={url} target="_blank" rel="noreferrer" className="text-[11px] text-sky-400 hover:text-sky-300">
                <LinkOutlined /> 來源 {i + 1}
              </a>
            </Tooltip>
          ))}
        </div>
      )}
    </li>
  );
}

interface Props {
  companies: Company[];
  onSelectCompany: (ticker: string) => void;
}

export function CompanyList({ companies, onSelectCompany }: Props) {
  const active = companies.filter((c) => c.verdict !== 'removed');
  const removed = companies.filter((c) => c.verdict === 'removed');
  return (
    <div>
      <ul>
        {active.map((c) => (
          <CompanyRow key={c.ticker} c={c} onSelect={onSelectCompany} />
        ))}
      </ul>
      {removed.length > 0 && (
        <Collapse
          ghost
          size="small"
          items={[
            {
              key: 'removed',
              label: <span className="text-xs text-slate-500">查證後移除（{removed.length}）</span>,
              children: (
                <ul>
                  {removed.map((c) => (
                    <CompanyRow key={c.ticker} c={c} onSelect={onSelectCompany} />
                  ))}
                </ul>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
