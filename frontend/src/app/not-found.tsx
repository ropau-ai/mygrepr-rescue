import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center px-6">
        <p className="text-6xl font-bold text-primary mb-4">404</p>
        <h1 className="text-xl font-bold mb-2">Page introuvable</h1>
        <p className="text-sm text-muted-foreground mb-8 max-w-sm">
          Cette page n'existe pas ou a ete deplacee.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au tableau de bord
        </Link>
      </div>
    </main>
  );
}
