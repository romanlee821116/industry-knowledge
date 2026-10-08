import type { ReactNode } from 'react';

interface Props {
  sidebar: ReactNode;
  search: ReactNode;
  sceneSwitch: ReactNode;
  viewport: ReactNode;
  toolbar: ReactNode;
  panel: ReactNode;
}

export function ExplorerLayout({ sidebar, search, sceneSwitch, viewport, toolbar, panel }: Props) {
  return (
    <div className="grid h-dvh grid-cols-1 bg-slate-950 text-slate-200 lg:grid-cols-[260px_1fr_380px]">
      <aside className="hidden flex-col overflow-hidden border-r border-slate-800 lg:flex">
        <div className="border-b border-slate-800 p-3">
          <h1 className="text-sm font-semibold tracking-wide text-slate-100">半導體產業 3D 知識庫</h1>
          <p className="mt-0.5 text-xs text-slate-500">AI 晶片：晶圓廠・封裝・測試</p>
        </div>
        <div className="flex-1 overflow-y-auto">{sidebar}</div>
      </aside>
      <main className="relative min-h-[60dvh] overflow-hidden">
        <div className="absolute inset-0">{viewport}</div>
        <div className="absolute left-3 right-3 top-3 z-20 flex flex-wrap items-start gap-2">
          <div className="min-w-64 flex-1 lg:max-w-96">{search}</div>
          {sceneSwitch}
        </div>
        <div className="absolute bottom-3 left-3 right-3 z-20">{toolbar}</div>
      </main>
      <section className="overflow-y-auto border-l border-slate-800">{panel}</section>
    </div>
  );
}
