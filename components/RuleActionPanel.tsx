'use client';

import { useEffect, useState } from 'react';

import { loadProgress, toggleBookmarkedRule, toggleCompletedRule } from '@/lib/progress';
import type { SubjectProgress } from '@/lib/types';

type RuleActionPanelProps = {
  subjectSlug: string;
  ruleId: string;
};

export function RuleActionPanel({ subjectSlug, ruleId }: RuleActionPanelProps) {
  const [progress, setProgress] = useState<SubjectProgress>(() => loadProgress(subjectSlug));

  useEffect(() => {
    setProgress(loadProgress(subjectSlug));
  }, [subjectSlug]);

  const isCompleted = progress.completedRuleIds.includes(ruleId);
  const isBookmarked = progress.bookmarkedRuleIds.includes(ruleId);

  return (
    <div className="card-actions wrap">
      <button
        type="button"
        className={`button ${isCompleted ? '' : 'secondary'}`}
        onClick={() => setProgress(toggleCompletedRule(progress, ruleId))}
      >
        {isCompleted ? 'Marked complete' : 'Mark rule complete'}
      </button>
      <button
        type="button"
        className={`button ${isBookmarked ? '' : 'secondary'}`}
        onClick={() => setProgress(toggleBookmarkedRule(progress, ruleId))}
      >
        {isBookmarked ? 'Bookmarked' : 'Bookmark for review'}
      </button>
    </div>
  );
}
