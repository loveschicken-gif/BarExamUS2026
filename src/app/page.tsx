import { ContentValidationAlert } from '@/components/ContentValidationAlert';
import { ReviewDashboard } from '@/components/ReviewDashboard';
import { SubjectDashboard } from '@/components/SubjectDashboard';
import { getContentValidationReport, getDashboardData, getQuizQuestions, getTopics } from '@/lib/content';

export default function HomePage() {
  const data = getDashboardData();
  const questions = getQuizQuestions();
  const validationReport = getContentValidationReport();

  return (
    <div className="page-stack">
      <ContentValidationAlert issues={validationReport.issues} />
      <SubjectDashboard data={data} />
      <ReviewDashboard topics={getTopics()} rules={data.rules} questions={questions} />
    </div>
  );
}
