import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bar Exam US 2026',
  description: 'JSON-driven Civil Procedure study app scaffold for U.S. bar exam preparation.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <header className="site-header">
            <Link href="/" className="site-header__brand">
              BarExamUS2026
            </Link>
            <nav className="site-header__nav" aria-label="Primary">
              <Link href="/">Subject</Link>
              <Link href="/topics">Topics</Link>
              <Link href="/quiz">Quiz</Link>
            </nav>
          </header>
          <main className="page-shell">{children}</main>
        </div>
      </body>
    </html>
  );
}
