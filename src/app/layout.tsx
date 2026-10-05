import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: "Kevin J. Zea's PIK Demo",
  description: 'Developed by Kevin J. Zea, GLM-5.3 & GLM-5.3-Flash',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
