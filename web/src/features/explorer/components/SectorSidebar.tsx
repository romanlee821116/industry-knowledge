import { Collapse } from 'antd';

import type { SectorCategory, SectorStatus } from '@/features/sectors';
import { cn } from '@/shared/lib/cn';

interface Props {
  categories: SectorCategory[];
  selectedGroupId: string | null;
  onSelectGroup: (id: string) => void;
}

const STATUS_DOT: Record<SectorStatus, string> = {
  modeled: 'bg-emerald-400',
  'verified-unmodeled': 'bg-sky-400',
  pending: 'bg-slate-600',
};

export function SectorSidebar({ categories, selectedGroupId, onSelectGroup }: Props) {
  return (
    <div className="pb-4">
      <div className="flex flex-wrap gap-x-3 gap-y-1 px-3 py-2 text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <i className={cn('h-2 w-2 rounded-full', STATUS_DOT.modeled)} />
          已建模
        </span>
        <span className="flex items-center gap-1">
          <i className={cn('h-2 w-2 rounded-full', STATUS_DOT['verified-unmodeled'])} />
          已查證・未建模
        </span>
        <span className="flex items-center gap-1">
          <i className={cn('h-2 w-2 rounded-full', STATUS_DOT.pending)} />
          待查證
        </span>
      </div>
      <Collapse
        ghost
        size="small"
        defaultActiveKey={['advanced-packaging', 'materials']}
        items={categories.map((cat) => ({
          key: cat.id,
          label: (
            <span className="text-xs font-medium text-slate-300">
              {cat.name}
              <span className="ml-1.5 text-slate-600">{cat.groups.length}</span>
            </span>
          ),
          children: (
            <ul className="-mx-2 -mt-1 space-y-px">
              {cat.groups.map((g) => (
                <li key={g.id}>
                  <button
                    type="button"
                    onClick={() => onSelectGroup(g.id)}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1 text-left text-xs text-slate-400 hover:bg-slate-800/70 hover:text-slate-100',
                      selectedGroupId === g.id && 'bg-slate-800 text-amber-300',
                    )}
                  >
                    <i className={cn('h-1.5 w-1.5 shrink-0 rounded-full', STATUS_DOT[g.status])} />
                    <span className="flex-1 truncate">{g.name}</span>
                    {g.companies.length > 0 && <span className="text-[10px] text-slate-600">{g.companies.length}</span>}
                  </button>
                </li>
              ))}
            </ul>
          ),
        }))}
      />
    </div>
  );
}
