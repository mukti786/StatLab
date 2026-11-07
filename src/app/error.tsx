'use client';

export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="not-found" role="alert">
      <div className="not-found-mark" aria-hidden="true">R</div>
      <p className="eyebrow">WORKSPACE INTERRUPTED</p>
      <h1>Let’s reopen the lab.</h1>
      <p>An unexpected page error stopped this view. Your browser-local learning progress remains saved.</p>
      <button className="primary" onClick={retry}>Try again</button>
    </main>
  );
}
