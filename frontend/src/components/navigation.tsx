'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Sun, Moon, Menu, X, LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useSession, signOut } from 'next-auth/react';
import { useLanguage } from '@/components/language-provider';

const NAV_KEYS = [
  { href: '/', key: 'nav.dashboard' },
  { href: '/posts', key: 'nav.explore' },
  { href: '/etf', key: 'nav.etf' },
] as const;

export function Navigation() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const { locale, setLocale, t } = useLanguage();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === 'dark';

  if (pathname?.startsWith('/login')) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 w-full bg-[var(--editorial-bg)]/80 backdrop-blur-md border-b border-[var(--editorial-border)]">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Wordmark */}
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-foreground leading-none shrink-0"
        >
          Grepr
        </Link>

        {/* Center: nav items (desktop) */}
        <div className="hidden md:flex items-center gap-8 h-full">
          {NAV_KEYS.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative h-full flex items-center text-[11px] font-bold uppercase tracking-[0.15em] transition-colors',
                  isActive
                    ? 'text-foreground'
                    : 'text-slate-500 dark:text-slate-400 hover:text-foreground'
                )}
              >
                {t(item.key)}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right utility cluster (desktop) */}
        <div className="hidden md:flex items-center gap-5 text-[10px] font-medium tracking-widest uppercase text-[var(--editorial-muted)] dark:text-slate-400">
          <button
            onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
            className="font-bold hover:text-indigo-600 transition-colors cursor-pointer"
            aria-label={locale === 'fr' ? 'Switch to English' : 'Passer en francais'}
          >
            {locale === 'fr' ? 'EN' : 'FR'}
          </button>

          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="hover:text-indigo-600 transition-colors cursor-pointer"
            aria-label={t('nav.toggle_theme')}
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* Auth */}
          {mounted && session?.user ? (
            <div className="flex items-center gap-2 normal-case tracking-normal">
              {session.user.image && (
                <Image
                  src={session.user.image}
                  alt=""
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              )}
              <button
                onClick={() => signOut()}
                className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                aria-label={t('nav.logout')}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : mounted ? (
            <Link
              href="/login"
              className="hover:text-indigo-600 transition-colors normal-case tracking-normal text-xs"
            >
              {t('nav.login')}
            </Link>
          ) : null}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden text-foreground hover:text-indigo-600 transition-colors"
          aria-label={isMobileMenuOpen ? t('nav.close_menu') : t('nav.open_menu')}
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--editorial-border)] bg-[var(--editorial-bg)]">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-4">
            {NAV_KEYS.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'text-[11px] font-bold uppercase tracking-[0.15em] transition-colors',
                    isActive ? 'text-indigo-600' : 'text-slate-600 dark:text-slate-300'
                  )}
                >
                  {t(item.key)}
                </Link>
              );
            })}
            <div className="flex items-center gap-5 pt-3 border-t border-[var(--editorial-border)] text-[10px] font-medium tracking-widest uppercase text-[var(--editorial-muted)] dark:text-slate-400">
              <button
                onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
                className="font-bold hover:text-indigo-600"
              >
                {locale === 'fr' ? 'EN' : 'FR'}
              </button>
              <button
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="hover:text-indigo-600"
                aria-label={t('nav.toggle_theme')}
              >
                {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
              {mounted && session?.user ? (
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-1 hover:text-indigo-600 normal-case tracking-normal"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {t('nav.logout')}
                </button>
              ) : mounted ? (
                <Link
                  href="/login"
                  className="hover:text-indigo-600 normal-case tracking-normal"
                >
                  {t('nav.login')}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
