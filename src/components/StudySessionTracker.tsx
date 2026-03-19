'use client';

import { useEffect } from 'react';
import { readProgressSnapshot, updateLastReviewed, writeProgressSnapshot } from '@/lib/progress';

interface StudySessionTrackerProps {
  topicId?: string;
  ruleId?: string;
}

export function StudySessionTracker({ topicId, ruleId }: StudySessionTrackerProps) {
  useEffect(() => {
    const snapshot = readProgressSnapshot();
    const nextSnapshot = updateLastReviewed(snapshot, topicId, ruleId);
    writeProgressSnapshot(nextSnapshot);
  }, [ruleId, topicId]);

  return null;
}
