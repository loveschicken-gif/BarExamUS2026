import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'BarExamUS2026 | Civ Pro',
  description: 'Minimal Civ Pro bar study app vertical slice with quiz, progress, and review insights.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
