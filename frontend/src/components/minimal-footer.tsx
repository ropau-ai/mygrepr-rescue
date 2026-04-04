'use client';

import Link from 'next/link';

export function MinimalFooter() {
  return (
    <footer className="px-8 py-12 border-t border-border mt-auto">
      <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
            G
          </div>
          <span className="font-bold text-lg">
            Grepr
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          &copy; 2026 Jelil Ahounou. Intelligence financiere par IA, extraite de Reddit.
        </p>
        <div className="flex gap-6">
          <Link href="/about" className="text-xs text-muted-foreground hover:text-foreground transition-colors">A propos</Link>
        </div>
      </div>
    </footer>
  );
}
