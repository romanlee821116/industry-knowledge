import { Modal, Slider } from 'antd';
import type { ReactNode } from 'react';

import type { MicroPart, MicroView } from '@/features/stack';

import type { LinkItem, Selection } from '../types';

interface Props {
  open: boolean;
  view: MicroView | null;
  part: MicroPart | null;
  partLinks: LinkItem[];
  explode: number;
  canExplode: boolean;
  canvas: ReactNode;
  onClose: () => void;
  onExplodeChange: (value: number) => void;
  onNavigate: (item: Selection) => void;
}

export function MicroViewModal({
  open,
  view,
  part,
  partLinks,
  explode,
  canExplode,
  canvas,
  onClose,
  onExplodeChange,
  onNavigate,
}: Props) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width="min(1100px, 96vw)"
      title={view?.name}
      destroyOnHidden
    >
      {view && (
        <div className="grid gap-4 md:grid-cols-[1fr_280px]">
          <div className="relative h-[60vh] overflow-hidden rounded-md">{canvas}</div>
          <div className="space-y-3 text-sm">
            <p className="leading-relaxed text-slate-300">{view.caption}</p>
            <p className="text-xs text-slate-500">{view.scaleNote}</p>
            {canExplode && (
              <div className="flex items-center gap-3 text-xs text-slate-400">
                分層拆開
                <Slider className="flex-1" min={0} max={1} step={0.01} value={explode} onChange={onExplodeChange} />
              </div>
            )}
            <div className="rounded-md bg-slate-900 p-3">
              {part ? (
                <>
                  <p className="font-medium text-amber-300">{part.name}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">{part.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {partLinks.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => onNavigate({ kind: l.kind, id: l.id })}
                        className="cursor-pointer rounded border border-slate-700 px-2 py-0.5 text-xs text-slate-300 hover:border-amber-400 hover:text-amber-300"
                      >
                        {l.label} →
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-500">點擊模型中的任一部位查看說明</p>
              )}
            </div>
            <ul className="space-y-1 text-xs text-slate-500">
              {view.parts.map((p) => (
                <li key={p.prefix}>・{p.name}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Modal>
  );
}
