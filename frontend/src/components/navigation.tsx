'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Bell, Sun, Moon, Menu, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth, UserButton } from '@clerk/nextjs';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard' },
  { href: '/posts', label: 'Deep Dives' },
  { href: '/consensus', label: 'Consensus' },
];

export function Navigation() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const { theme, setTheme } = useTheme();
  const { isSignedIn } = useAuth();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === 'dark';

  // Hide nav on landing and auth pages
  if (pathname?.startsWith('/landing') || pathname?.startsWith('/login') || pathname?.startsWith('/sign-up')) {
    return null;
  }

  return (
    <nav className="border-b border-border px-6 py-4 grid grid-cols-3 items-center bg-background sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'hover:text-foreground transition-colors',
                  isActive && 'text-foreground border-b-2 border-foreground pb-1'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center">
        <Link href="/">
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-serif), serif' }}>
            Grepr
          </h1>
        </Link>
      </div>

      <div className="flex items-center gap-4 justify-end">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search"
            className="bg-muted/50 border border-border rounded-md pl-10 pr-4 py-1.5 text-sm w-64 focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all"
          />
        </div>
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="p-2 hover:bg-accent rounded-full transition-colors"
        >
          {isDark ? <Sun className="w-5 h-5 text-muted-foreground" /> : <Moon className="w-5 h-5 text-muted-foreground" />}
        </button>
        <button className="p-2 hover:bg-accent rounded-full transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Auth */}
        {isSignedIn ? (
          <UserButton />
        ) : (
          <Link
            href="/login"
            className="px-3 py-1.5 rounded-md border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors hidden sm:block"
          >
            Se connecter
          </Link>
        )}

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 hover:bg-accent rounded-full transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-background border-b border-border p-4 md:hidden col-span-3">
          <div className="flex flex-col gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground hover:bg-accent'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/settings"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
            >
              Settings
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
