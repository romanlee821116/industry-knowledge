import { Segmented } from 'antd';

import type { SceneKey } from '@/features/stack';

interface Props {
  value: SceneKey;
  options: { value: SceneKey; label: string }[];
  onChange: (scene: SceneKey) => void;
}

export function SceneSwitch({ value, options, onChange }: Props) {
  return <Segmented size="large" value={value} options={options} onChange={(v) => onChange(v as SceneKey)} />;
}
