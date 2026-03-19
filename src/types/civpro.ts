export type ApprovalStatus = 'approved' | 'reviewed' | 'draft';

export type Rule = {
  id: string;
  title: string;
  summary: string;
};

export type Topic = {
  id: string;
  name: string;
  rules: Rule[];
};

export type Question = {
  id: string;
  topicId: string;
  ruleIds: string[];
  approvalStatus?: ApprovalStatus;
  stem: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
};

export type RuleCatalog = {
  subject: string;
  topics: Topic[];
};

export type QuestionCatalog = {
  subject: string;
  questions: Question[];
};

export type PersistedQuestionProgress = {
  attempts: number;
  correctAttempts: number;
  incorrectAttempts: number;
  flagged: boolean;
  lastSeenAt?: string;
};

export type SessionRecord = {
  id: string;
  completedAt: string;
  questionIds: string[];
  attempted: number;
  correct: number;
  incorrect: number;
  flaggedCount: number;
  filters: {
    topicId: string;
    questionStatus: QuestionStatusFilter;
    setSize: number;
    reviewedOnly: boolean;
  };
  missedRuleIds: string[];
  missedTopicIds: string[];
  missedQuestionIds: string[];
};

export type ProgressState = {
  version: number;
  subject: string;
  questionProgress: Record<string, PersistedQuestionProgress>;
  sessions: SessionRecord[];
  updatedAt: string;
};

export type QuestionStatusFilter = 'all' | 'unseen' | 'missed' | 'flagged';

export type QuizFilters = {
  topicId: string;
  questionStatus: QuestionStatusFilter;
  setSize: number;
  reviewedOnly: boolean;
};

export type AnswerRecord = {
  questionId: string;
  selectedIndex: number;
  isCorrect: boolean;
  flagged: boolean;
};

export type ReviewIssue = {
  kind: 'duplicate-id' | 'duplicate-stem' | 'near-duplicate-stem';
  details: string;
  questionIds: string[];
};
