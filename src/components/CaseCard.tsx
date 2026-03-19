import { CaseSummary } from '@/lib/types';

interface CaseCardProps {
  caseItem: CaseSummary;
}

export function CaseCard({ caseItem }: CaseCardProps) {
  return (
    <article className="card case-card">
      <div className="card__eyebrow">Case</div>
      <div className="case-card__title-row">
        <h3>{caseItem.title}</h3>
        <span className="case-card__citation">{caseItem.citation}</span>
      </div>
      <p className="card__muted">{caseItem.courtAndYear}</p>
      <p>
        <strong>Holding:</strong> {caseItem.holding}
      </p>
      <p>
        <strong>Why it matters:</strong> {caseItem.ruleConnection}
      </p>
      <ul>
        {caseItem.takeaways.map((takeaway) => (
          <li key={takeaway}>{takeaway}</li>
        ))}
      </ul>
    </article>
  );
}
