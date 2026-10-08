import { ReloadOutlined } from '@ant-design/icons';
import { Button, Slider, Switch, Tooltip } from 'antd';

interface Props {
  explode: number;
  clipEnabled: boolean;
  clipX: number;
  onExplodeChange: (value: number) => void;
  onClipEnabledChange: (value: boolean) => void;
  onClipXChange: (value: number) => void;
  onReset: () => void;
}

export function ViewToolbar({
  explode,
  clipEnabled,
  clipX,
  onExplodeChange,
  onClipEnabledChange,
  onClipXChange,
  onReset,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-slate-800 bg-slate-900/85 px-4 py-2 backdrop-blur">
      <div className="flex min-w-56 flex-1 items-center gap-3 text-xs text-slate-400">
        爆炸分解
        <Slider
          className="flex-1"
          min={0}
          max={1}
          step={0.01}
          value={explode}
          onChange={onExplodeChange}
          tooltip={{ open: false }}
        />
      </div>
      <div className="flex min-w-56 flex-1 items-center gap-3 text-xs text-slate-400">
        剖面
        <Switch size="small" checked={clipEnabled} onChange={onClipEnabledChange} />
        <Slider
          className="flex-1"
          min={-12}
          max={12}
          step={0.05}
          value={clipX}
          disabled={!clipEnabled}
          onChange={onClipXChange}
          tooltip={{ open: false }}
        />
      </div>
      <Tooltip title="重設視角">
        <Button type="text" icon={<ReloadOutlined />} onClick={onReset} />
      </Tooltip>
      <span className="w-full text-[11px] text-slate-500">厚度已誇張化以利辨識，非真實比例；點擊任一層查看知識卡</span>
    </div>
  );
}
