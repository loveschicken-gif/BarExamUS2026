import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="hero card stack-sm">
      <p className="eyebrow">Not found</p>
      <h1>That study page does not exist.</h1>
      <p className="muted">Try returning to the Civ Pro dashboard or the subject list.</p>
      <div className="card-actions wrap">
        <Link href="/" className="button secondary">
          Subject list
        </Link>
        <Link href="/subjects/civ-pro" className="button">
          Civ Pro dashboard
        </Link>
      </div>
    </section>
  );
}
