'use client';

import dynamic from 'next/dynamic';

/** WebGL 只能在瀏覽器執行，整個探索器不做伺服器預渲染 */
export const ExplorerClient = dynamic(() => import('./ExplorerContainer').then((m) => m.ExplorerContainer), {
  ssr: false,
});
