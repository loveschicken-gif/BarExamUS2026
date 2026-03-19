import { ReactNode } from 'react';

interface SectionBlockProps {
  title: string;
  children: ReactNode;
}

export function SectionBlock({ title, children }: SectionBlockProps) {
  return (
    <section className="section-block">
      <div className="section-block__header">
        <h2>{title}</h2>
      </div>
      <div className="section-block__content">{children}</div>
    </section>
  );
}
