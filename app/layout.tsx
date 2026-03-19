import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';

import './globals.css';

export const metadata: Metadata = {
  title: 'BarExamUS2026',
  description: 'Lean JSON-driven bar exam study app starting with Civil Procedure.'
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <header className="site-header">
            <div>
              <Link href="/" className="brand">
                BarExamUS2026
              </Link>
              <p className="muted">Fresh-build V1 · Next.js App Router · JSON-driven legal content</p>
            </div>
            <nav className="top-nav">
              <Link href="/">Subjects</Link>
              <Link href="/subjects/civ-pro">Civ Pro dashboard</Link>
              <Link href="/subjects/civ-pro/quiz">Quiz</Link>
              <Link href="/subjects/civ-pro/review">Review</Link>
            </nav>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
