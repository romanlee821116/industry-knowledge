import { SearchOutlined } from '@ant-design/icons';
import { AutoComplete, Input } from 'antd';
import { useState } from 'react';

import type { SearchGroup } from '../types';

interface Props {
  groups: SearchGroup[];
  onSelect: (value: string) => void;
}

export function SearchBox({ groups, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const options = q
    ? groups
        .map((g) => ({
          label: g.label,
          options: g.options
            .filter((o) => o.label.toLowerCase().includes(q) || o.hint.toLowerCase().includes(q))
            .slice(0, 8)
            .map((o) => ({
              value: o.value,
              label: (
                <div className="flex items-baseline justify-between gap-3">
                  <span>{o.label}</span>
                  <span className="truncate text-xs text-slate-500">{o.hint}</span>
                </div>
              ),
            })),
        }))
        .filter((g) => g.options.length > 0)
    : [];

  return (
    <AutoComplete
      className="w-full"
      value={query}
      options={options}
      onChange={setQuery}
      onSelect={(value: string) => {
        onSelect(value);
        setQuery('');
      }}
      popupMatchSelectWidth={420}
    >
      <Input size="large" prefix={<SearchOutlined />} placeholder="搜尋：玻纖布、CoWoS-L、欣興、3037…" allowClear />
    </AutoComplete>
  );
}
