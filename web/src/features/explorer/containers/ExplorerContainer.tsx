'use client';

import { MicroCanvas, StackCanvas } from '@/features/stack';

import { ExplorerLayout } from '../components/ExplorerLayout';
import { KnowledgePanel } from '../components/KnowledgePanel';
import { MicroViewModal } from '../components/MicroViewModal';
import { SceneSwitch } from '../components/SceneSwitch';
import { SearchBox } from '../components/SearchBox';
import { SectorSidebar } from '../components/SectorSidebar';
import { ViewToolbar } from '../components/ViewToolbar';
import { useExplorer, useMicroView } from '../hooks/useExplorer';

function MicroViewContainer() {
  const micro = useMicroView();
  return (
    <MicroViewModal
      open={micro.open}
      view={micro.view}
      part={micro.part}
      partLinks={micro.partLinks}
      explode={micro.explode}
      canExplode={micro.canExplode}
      onClose={micro.onClose}
      onExplodeChange={micro.onExplodeChange}
      onNavigate={micro.onNavigate}
      canvas={
        micro.view && (
          <MicroCanvas
            view={micro.view}
            explode={micro.explode}
            glassTint={micro.glassTint}
            selectedPrefix={micro.part?.prefix ?? null}
            onSelectPart={micro.onSelectPart}
          />
        )
      }
    />
  );
}

export function ExplorerContainer() {
  const ex = useExplorer();
  return (
    <>
      <ExplorerLayout
        sidebar={<SectorSidebar {...ex.sidebar} />}
        search={<SearchBox {...ex.search} />}
        sceneSwitch={<SceneSwitch {...ex.sceneSwitch} />}
        viewport={<StackCanvas {...ex.canvas} />}
        toolbar={<ViewToolbar {...ex.toolbar} />}
        panel={<KnowledgePanel {...ex.panel} />}
      />
      <MicroViewContainer />
    </>
  );
}
