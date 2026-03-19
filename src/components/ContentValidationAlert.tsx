import { ValidationIssue } from '@/lib/types';

interface ContentValidationAlertProps {
  issues: ValidationIssue[];
}

export function ContentValidationAlert({ issues }: ContentValidationAlertProps) {
  if (issues.length === 0) {
    return null;
  }

  const visibleIssues = issues.slice(0, 4);
  const errorCount = issues.filter((issue) => issue.severity === 'error').length;

  return (
    <section className="validation-alert" aria-live="polite">
      <div>
        <p className="validation-alert__eyebrow">Content validation</p>
        <h2>{errorCount > 0 ? 'Some study content needs review.' : 'Content warnings detected.'}</h2>
        <p>
          The app filtered invalid data where possible so studying can continue, but the following items should be
          reviewed.
        </p>
      </div>
      <ul>
        {visibleIssues.map((issue) => (
          <li key={`${issue.code}-${issue.entityType}-${issue.entityId ?? issue.message}`}>
            <strong>{issue.severity.toUpperCase()}</strong>: {issue.message}
          </li>
        ))}
      </ul>
      {issues.length > visibleIssues.length ? <p>Showing {visibleIssues.length} of {issues.length} issues.</p> : null}
    </section>
  );
}
