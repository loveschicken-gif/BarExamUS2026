import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CaseCard } from '@/components/CaseCard';
import { ContentValidationAlert } from '@/components/ContentValidationAlert';
import { RuleCompletionPanel } from '@/components/RuleCompletionPanel';
import { SectionBlock } from '@/components/SectionBlock';
import { StudySessionTracker } from '@/components/StudySessionTracker';
import { getContentValidationReport, getRuleById, getStaticRuleIds } from '@/lib/content';

export function generateStaticParams() {
  return getStaticRuleIds().map((ruleId) => ({ ruleId }));
}

export default function RuleDetailPage({ params }: { params: { ruleId: string } }) {
  const rule = getRuleById(params.ruleId);
  const validationReport = getContentValidationReport();

  if (!rule) {
    notFound();
  }

  return (
    <div className="page-stack rule-detail-page">
      <StudySessionTracker topicId={rule.topic.id} ruleId={rule.id} />
      <ContentValidationAlert issues={validationReport.issues} />

      <section className="page-intro">
        <p className="page-intro__eyebrow">Rule</p>
        <h1>{rule.title}</h1>
        <p>{rule.blackLetterRule}</p>
        <div className="breadcrumb-row">
          <Link href="/">Subject</Link>
          <span>/</span>
          <Link href="/topics">Topics</Link>
          <span>/</span>
          <Link href={`/topics/${rule.topic.id}`}>{rule.topic.title}</Link>
        </div>
        <div className="chip-row">
          <Link className="button button--secondary" href={`/quiz?ruleId=${rule.id}`}>
            Quiz this rule
          </Link>
        </div>
      </section>

      <RuleCompletionPanel ruleId={rule.id} />

      <SectionBlock title="Black-letter rule">
        <p>{rule.blackLetterRule}</p>
      </SectionBlock>

      <SectionBlock title="Elements">
        <ol className="number-list">
          {rule.elements.map((element) => (
            <li key={element}>{element}</li>
          ))}
        </ol>
      </SectionBlock>

      <SectionBlock title="Exceptions">
        <ul>
          {rule.exceptions.map((exception) => (
            <li key={exception}>{exception}</li>
          ))}
        </ul>
      </SectionBlock>

      <SectionBlock title="Exam tips">
        <ul>
          {rule.examTips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </SectionBlock>

      <SectionBlock title="Linked cases">
        <div className="stack-md">
          {rule.linkedCases.map((caseItem) => (
            <CaseCard key={caseItem.id} caseItem={caseItem} />
          ))}
        </div>
      </SectionBlock>
    </div>
  );
}
