'use client';

import { useEffect, useState } from 'react';
import { ProgressSnapshot } from '@/lib/types';
import { markRuleCompleted, readProgressSnapshot, writeProgressSnapshot } from '@/lib/progress';

interface RuleCompletionPanelProps {
  ruleId: string;
}

export function RuleCompletionPanel({ ruleId }: RuleCompletionPanelProps) {
  const [snapshot, setSnapshot] = useState<ProgressSnapshot | null>(null);

  useEffect(() => {
    setSnapshot(readProgressSnapshot());
  }, []);

  const isCompleted = snapshot?.completedRuleIds.includes(ruleId) ?? false;

  const handleComplete = () => {
    const currentSnapshot = snapshot ?? readProgressSnapshot();
    const nextSnapshot = markRuleCompleted(currentSnapshot, ruleId);
    writeProgressSnapshot(nextSnapshot);
    setSnapshot(nextSnapshot);
  };

  return (
    <section className="card progress-panel">
      <div className="card__eyebrow">Progress</div>
      <h2>{isCompleted ? 'Rule completed' : 'Mark this rule complete when you can state it cold.'}</h2>
      <p>
        {isCompleted
          ? 'This rule is stored in local progress, so the dashboard can highlight your completed Civ Pro coverage.'
          : 'Completion is tracked locally in your browser and can feed later review flows.'}
      </p>
      <button className="button" type="button" onClick={handleComplete} disabled={isCompleted}>
        {isCompleted ? 'Completed' : 'Mark rule complete'}
      </button>
      {snapshot?.lastReviewedAt ? (
        <p className="card__muted">Last reviewed: {new Date(snapshot.lastReviewedAt).toLocaleString()}</p>
      ) : null}
    </section>
  );
}
