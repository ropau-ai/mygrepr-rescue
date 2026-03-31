'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold mb-2">Une erreur est survenue</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Impossible de charger cette page. Veuillez reessayer.
        </p>
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Reessayer
        </button>
      </div>
    </main>
  );
}
