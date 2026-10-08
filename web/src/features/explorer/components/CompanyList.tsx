import { LinkOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';

import type { Company } from '@/features/sectors';

function Stars({ core }: { core: number }) {
  return (
    <span className="text-amber-400" aria-label={`核心程度 ${core}`}>
      {'★'.repeat(core)}
      <span className="text-slate-700">{'★'.repeat(3 - core)}</span>
    </span>
  );
}

interface Props {
  companies: Company[];
  onSelectCompany: (ticker: string) => void;
}

export function CompanyList({ companies, onSelectCompany }: Props) {
  return (
    <ul>
      {companies.map((c) => (
        <li key={c.ticker} className="border-b border-slate-800/80 py-2 last:border-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectCompany(c.ticker)}
              className="cursor-pointer text-sm font-medium text-slate-100 hover:text-amber-300"
            >
              {c.name}
              <span className="ml-1 font-mono text-xs text-slate-500">{c.ticker}</span>
            </button>
            <Stars core={c.core} />
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">{c.role}</p>
          {c.sources.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-2">
              {c.sources.map((url, i) => (
                <Tooltip key={url} title={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-sky-400 hover:text-sky-300"
                  >
                    <LinkOutlined /> 來源 {i + 1}
                  </a>
                </Tooltip>
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
