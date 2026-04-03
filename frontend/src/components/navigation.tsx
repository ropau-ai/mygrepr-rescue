'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ChevronDown, Sun, Moon, Menu, X, TrendingUp, BarChart3, Newspaper, Compass, LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useSession, signOut } from 'next-auth/react';

interface NavItem {
  href: string;
  label: string;
  hasDropdown?: boolean;
  dropdownItems?: { href: string; label: string; desc: string; icon: React.ElementType }[];
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/posts',
    label: 'Explorer',
    hasDropdown: true,
    dropdownItems: [
      { href: '/posts', label: 'Tous les Posts', desc: 'Parcourir les analyses Reddit finance', icon: Newspaper },
      { href: '/posts?sort=date', label: 'Tendances', desc: 'Les sujets qui montent en ce moment', icon: TrendingUp },
      { href: '/', label: 'ETF Rankings', desc: 'Classement des ETFs les plus mentionnes', icon: BarChart3 },
    ],
  },
  { href: '/consensus', label: 'Consensus' },
  { href: '/about', label: 'A propos' },
];

export function Navigation() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isDark = mounted && theme === 'dark';

  // Hide nav on landing and login pages
  if (pathname?.startsWith('/landing') || pathname?.startsWith('/login')) {
    return null;
  }

  return (
    <nav className="border-b border-border px-6 py-3 bg-background sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Compass className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Grepr
          </span>
        </Link>

        {/* Center nav items */}
        <div className="hidden md:flex items-center gap-1" ref={dropdownRef}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            const isDropdownOpen = openDropdown === item.label;

            if (item.hasDropdown) {
              return (
                <div key={item.label} className="relative">
                  <button
                    onClick={() => setOpenDropdown(isDropdownOpen ? null : item.label)}
                    className={cn(
                      'flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive || isDropdownOpen
                        ? 'text-primary bg-accent'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    {item.label}
                    <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', isDropdownOpen && 'rotate-180')} />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-80 bg-card border border-border rounded-xl shadow-lg p-2 z-50">
                      {item.dropdownItems?.map((dropItem) => {
                        const Icon = dropItem.icon;
                        return (
                          <Link
                            key={dropItem.href}
                            href={dropItem.href}
                            onClick={() => setOpenDropdown(null)}
                            className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                          >
                            <Icon className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-foreground">{dropItem.label}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{dropItem.desc}</p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'text-primary bg-accent'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Changer le theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-muted-foreground" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
          </button>

          {/* Auth */}
          {mounted && session?.user ? (
            <div className="flex items-center gap-2">
              {session.user.image && (
                <Image
                  src={session.user.image}
                  alt=""
                  width={28}
                  height={28}
                  className="rounded-full"
                />
              )}
              <button
                onClick={() => signOut()}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Se deconnecter"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Deconnexion</span>
              </button>
            </div>
          ) : mounted ? (
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Connexion
            </Link>
          ) : null}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border mt-3 pt-3 pb-2">
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              if (item.hasDropdown && item.dropdownItems) {
                return (
                  <React.Fragment key={item.label}>
                    {item.dropdownItems.map((dropItem) => {
                      const Icon = dropItem.icon;
                      return (
                        <Link
                          key={dropItem.href}
                          href={dropItem.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
                        >
                          <Icon className="w-4 h-4" />
                          {dropItem.label}
                        </Link>
                      );
                    })}
                  </React.Fragment>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
