import type { Metadata } from 'next';
import './globals.css';

import { AntdProvider } from '@/providers/AntdProvider';

export const metadata: Metadata = {
  title: '半導體產業 3D 知識庫',
  description: 'CoWoS AI GPU 封裝全堆疊互動 3D 圖解：載板、玻纖布、CCL 與台股族群對應',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="zh-Hant" className="h-full antialiased">
      <body className="min-h-full bg-slate-950">
        <AntdProvider>{children}</AntdProvider>
      </body>
    </html>
  );
}
