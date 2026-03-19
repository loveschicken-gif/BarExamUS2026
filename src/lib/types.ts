export type SubjectId = string;
export type TopicId = string;
export type RuleId = string;
export type CaseId = string;
export type QuestionId = string;

export interface Subject {
  id: SubjectId;
  title: string;
  shortTitle: string;
  description: string;
  examFocus: string[];
  primaryCtaLabel?: string;
  topicOrder: TopicId[];
}

export interface Topic {
  id: TopicId;
  subjectId: SubjectId;
  title: string;
  slug: string;
  summary: string;
  whyItMatters: string;
  ruleIds: RuleId[];
}

export interface Rule {
  id: RuleId;
  subjectId: SubjectId;
  topicId: TopicId;
  title: string;
  shortLabel: string;
  blackLetterRule: string;
  elements: string[];
  exceptions: string[];
  examTips: string[];
  caseIds: CaseId[];
  outlineRefs?: string[];
}

export interface CaseSummary {
  id: CaseId;
  subjectId: SubjectId;
  topicId: TopicId;
  ruleIds: RuleId[];
  title: string;
  citation: string;
  courtAndYear: string;
  holding: string;
  ruleConnection: string;
  takeaways: string[];
}

export interface OutlineSection {
  id: string;
  subjectId: SubjectId;
  topicId: TopicId;
  title: string;
  bullets: string[];
}

export type ContentStatus = 'draft' | 'reviewed' | 'approved';

export type DraftQuestionStatus = ContentStatus;

export interface DraftQuestion {
  id: QuestionId;
  subjectId: SubjectId;
  topicId: TopicId;
  ruleId: RuleId;
  prompt: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
  status: DraftQuestionStatus;
}

export interface SubjectDataset {
  subject: Subject;
  topics: Topic[];
  rules: Rule[];
  cases: CaseSummary[];
  outlines: OutlineSection[];
  questions: DraftQuestion[];
}

export interface RuleDetail extends Rule {
  topic: Topic;
  linkedCases: CaseSummary[];
}

export interface TopicDetail extends Topic {
  rules: Rule[];
  outlineSections: OutlineSection[];
}

export interface SubjectDashboardData {
  subject: Subject;
  topics: TopicDetail[];
  rules: Rule[];
  ruleCount: number;
  caseCount: number;
  questionCount: number;
}

export interface QuizQuestionDetail extends DraftQuestion {
  topic?: Topic;
  linkedRule?: Rule;
  linkedCases: CaseSummary[];
}

export type ValidationSeverity = 'error' | 'warning';

export interface ValidationIssue {
  code: string;
  severity: ValidationSeverity;
  entityType: 'subject' | 'topic' | 'rule' | 'case' | 'outline' | 'question' | 'dataset';
  entityId?: string;
  message: string;
}

export interface ValidationReport {
  issues: ValidationIssue[];
}

export interface QuizAttempt {
  questionId: QuestionId;
  ruleId: RuleId;
  topicId: TopicId;
  selectedAnswerIndex: number;
  isCorrect: boolean;
  answeredAt: string;
}

export interface QuestionPerformance {
  questionId: QuestionId;
  attempts: number;
  correctCount: number;
  incorrectCount: number;
  lastAttemptAt?: string;
  lastSelectedAnswerIndex?: number;
  lastResult?: 'correct' | 'incorrect';
}

export interface ProgressSnapshot {
  completedRuleIds: RuleId[];
  savedCaseIds: CaseId[];
  flaggedQuestionIds: QuestionId[];
  quizAttempts: QuizAttempt[];
  questionPerformance: Record<QuestionId, QuestionPerformance>;
  correctCount: number;
  incorrectCount: number;
  lastReviewedAt?: string;
  lastTopicId?: TopicId;
  lastRuleId?: RuleId;
  lastQuestionId?: QuestionId;
}

export interface WeakPerformanceItem {
  id: string;
  accuracy: number;
  attempts: number;
}

export interface ProgressInsights {
  missedQuestionIds: QuestionId[];
  flaggedQuestionIds: QuestionId[];
  weakRuleIds: RuleId[];
  weakTopicIds: TopicId[];
  lastTopicId?: TopicId;
  lastRuleId?: RuleId;
  lastQuestionId?: QuestionId;
  lastReviewedAt?: string;
}
