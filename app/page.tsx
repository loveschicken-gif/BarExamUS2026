import Link from 'next/link';

import { getAllSubjects } from '@/lib/content';

export default async function HomePage() {
  const subjects = await getAllSubjects();

  return (
    <div className="stack-lg">
      <section className="hero card stack-sm">
        <p className="eyebrow">V1 subject dashboard</p>
        <h1>Bar exam subjects</h1>
        <p className="muted">
          This repository started empty, so this first version focuses on a reusable JSON-driven architecture and a single subject: Civil Procedure.
        </p>
      </section>

      <section className="card-grid">
        {subjects.map(({ subject, topics, rules, questions }) => (
          <article key={subject.slug} className="card stack-sm">
            <div className="stack-xs">
              <p className="eyebrow">Available subject</p>
              <h2>{subject.title}</h2>
              <p className="muted">{subject.description}</p>
            </div>

            <div className="pill-row">
              <span className="pill">{topics.length} topics</span>
              <span className="pill">{rules.length} rules</span>
              <span className="pill">{questions.length} quiz questions</span>
            </div>

            <ul className="compact-list muted">
              {subject.examFocus.map((focus) => (
                <li key={focus}>{focus}</li>
              ))}
            </ul>

            <div className="card-actions">
              <Link href={`/subjects/${subject.slug}`} className="button">
                Open {subject.shortTitle}
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
