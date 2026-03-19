export type SubjectSummary = {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  examFocus: string[];
  topicOrder: string[];
};

export type Rule = {
  id: string;
  topicSlug: string;
  title: string;
  blackLetterLaw: string;
  explanation: string;
  elements: string[];
  pitfalls: string[];
  relatedRuleIds: string[];
};

export type Choice = {
  id: string;
  text: string;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  choices: Choice[];
  correctChoiceId: string;
  ruleIds: string[];
  rationale: string;
};

export type Topic = {
  id: string;
  subjectSlug: string;
  slug: string;
  title: string;
  summary: string;
  learningObjectives: string[];
  ruleIds: string[];
  rules: Rule[];
  questions: QuizQuestion[];
};

export type SubjectContent = {
  subject: SubjectSummary;
  topics: Topic[];
  rules: Rule[];
  questions: QuizQuestion[];
};

export type QuizAnswerRecord = {
  questionId: string;
  selectedChoiceId: string;
  isCorrect: boolean;
  answeredAt: string;
  ruleIds: string[];
};

export type SubjectProgress = {
  subjectSlug: string;
  completedRuleIds: string[];
  bookmarkedRuleIds: string[];
  answers: Record<string, QuizAnswerRecord>;
  lastQuizScore?: {
    correct: number;
    total: number;
    completedAt: string;
  };
  updatedAt: string;
};

export type ReviewItem = {
  ruleId: string;
  misses: number;
  questionIds: string[];
};
