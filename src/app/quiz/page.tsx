import { ContentValidationAlert } from '@/components/ContentValidationAlert';
import { QuizRunner } from '@/components/QuizRunner';
import { getContentValidationReport, getQuizQuestions } from '@/lib/content';

export default function QuizPage({
  searchParams,
}: {
  searchParams?: { mode?: string; topicId?: string; ruleId?: string };
}) {
  const questions = getQuizQuestions();
  const validationReport = getContentValidationReport();

  return (
    <div className="page-stack">
      <ContentValidationAlert issues={validationReport.issues} />
      <QuizRunner
        questions={questions}
        initialMode={searchParams?.mode}
        topicId={searchParams?.topicId}
        ruleId={searchParams?.ruleId}
      />
    </div>
  );
}
