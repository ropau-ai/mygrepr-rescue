'use client';

import Link from 'next/link';

export function MinimalFooter() {
  return (
    <footer className="px-8 py-12 border-t border-border mt-auto">
      <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-foreground rounded flex items-center justify-center text-background font-bold" style={{ fontFamily: 'var(--font-serif), serif' }}>
            G
          </div>
          <span className="font-bold text-lg" style={{ fontFamily: 'var(--font-serif), serif' }}>
            Grepr
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          &copy; 2026 Jelil Ahounou. AI-powered financial insights from Reddit.
        </p>
        <div className="flex gap-6">
          <Link href="/about" className="text-xs text-muted-foreground hover:text-foreground transition-colors">About</Link>
          <Link href="/settings" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Settings</Link>
        </div>
      </div>
    </footer>
  );
}
