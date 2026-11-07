import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="not-found">
      <div className="not-found-mark" aria-hidden="true">404</div>
      <p className="eyebrow">OUTSIDE THE DATASET</p>
      <h1>This page isn’t in the lab.</h1>
      <p>The address may have changed. Return to StatLab and choose a learning module from the workspace.</p>
      <Link className="primary" href="/">Back to StatLab</Link>
    </main>
  );
}
