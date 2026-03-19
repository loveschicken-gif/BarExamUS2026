import Link from 'next/link';
import { Rule } from '@/lib/types';

interface RuleCardProps {
  rule: Rule;
}

export function RuleCard({ rule }: RuleCardProps) {
  return (
    <article className="card rule-card">
      <div className="card__eyebrow">Rule</div>
      <h3>{rule.title}</h3>
      <p>{rule.blackLetterRule}</p>
      <div className="chip-row">
        <span className="chip">{rule.elements.length} elements</span>
        <span className="chip">{rule.exceptions.length} exceptions</span>
        <span className="chip">{rule.caseIds.length} cases</span>
      </div>
      <Link className="button button--secondary" href={`/rules/${rule.id}`}>
        Study rule
      </Link>
    </article>
  );
}
