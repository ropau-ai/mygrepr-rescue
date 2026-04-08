'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/language-provider';

export function MinimalFooter() {
  const { t } = useLanguage();

  return (
    <footer className="px-6 py-10 border-t border-[var(--editorial-border)] mt-auto bg-[var(--editorial-bg)]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <span className="text-xl font-bold tracking-tight text-foreground">
          Grepr
        </span>
        <p className="text-xs text-[var(--editorial-muted)] dark:text-slate-400">
          {t('footer.copyright')}
        </p>
        <div className="flex gap-6">
          <Link
            href="/about"
            className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--editorial-muted)] dark:text-slate-400 hover:text-indigo-600 transition-colors"
          >
            {t('footer.about')}
          </Link>
        </div>
      </div>
    </footer>
  );
}
