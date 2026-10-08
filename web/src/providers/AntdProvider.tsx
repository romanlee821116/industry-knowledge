'use client';

import { ConfigProvider, theme } from 'antd';
import zhTW from 'antd/locale/zh_TW';
import type { ReactNode } from 'react';

/** 探索器整頁為 client-only（WebGL），不需要 AntdRegistry 做 SSR 樣式抽取 */
export function AntdProvider({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider
      locale={zhTW}
      theme={{ algorithm: theme.darkAlgorithm, token: { colorPrimary: '#f59e0b', borderRadius: 6 } }}
    >
      {children}
    </ConfigProvider>
  );
}
