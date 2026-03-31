'use client';

export default function PostsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold mb-2">Impossible de charger les posts</h1>
        <p className="text-sm text-muted-foreground mb-6">
          La connexion a la base de donnees a echoue. Veuillez reessayer dans quelques instants.
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
