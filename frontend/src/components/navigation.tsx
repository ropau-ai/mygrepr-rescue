'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion';
import { BarChart3, FileText, Settings, User, Sun, Moon, Menu, X, Scale } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: BarChart3 },
  { href: '/posts', label: 'Posts', icon: FileText },
  { href: '/consensus', label: 'Consensus', icon: Scale },
  { href: '/settings', label: 'Settings', icon: Settings },
];

// Spring physics for smooth animations
const SMOOTH_SPRING = {
  type: 'spring' as const,
  stiffness: 100,
  damping: 22,
  mass: 1,
};

const MORPH_TRANSITION = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 26,
  mass: 0.4,
  restDelta: 0.001,
};

export function Navigation() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const { theme, setTheme } = useTheme();

  // Prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Scroll progress bar
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Handle scroll state
  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on scroll
  React.useEffect(() => {
    if (isMobileMenuOpen && isScrolled) {
      setIsMobileMenuOpen(false);
    }
  }, [isScrolled, isMobileMenuOpen]);

  // Only check theme after mounting to prevent hydration mismatch
  const isDark = mounted && theme === 'dark';

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 flex justify-center px-3 sm:px-6 pt-2 sm:pt-4 pointer-events-none"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ ...SMOOTH_SPRING, delay: 0.1 }}
    >
      <motion.nav
        className="flex flex-col pointer-events-auto relative overflow-hidden backdrop-blur-sm border bg-card/95 border-border"
        animate={{
          width: isScrolled ? 300 : 800,
          borderRadius: isScrolled ? 9999 : 16,
          paddingTop: isScrolled ? 8 : 12,
          paddingBottom: isScrolled ? 8 : 12,
          paddingLeft: isScrolled ? 12 : 16,
          paddingRight: isScrolled ? 12 : 16,
        }}
        transition={MORPH_TRANSITION}
      >
        <div className="flex items-center justify-between w-full">
          {/* Left: Logo + Name */}
          <Link
            href="/"
            className="flex items-center shrink-0 relative hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            {/* Logo */}
            <div
              className={cn(
                'rounded-lg overflow-hidden ring-2 shrink-0 transition-colors flex items-center justify-center',
                'bg-primary ring-primary/50',
                isScrolled ? 'w-7 h-7' : 'w-9 h-9'
              )}
            >
              <span
                className={cn(
                  'font-bold text-primary-foreground transition-colors',
                  isScrolled ? 'text-xs' : 'text-sm'
                )}
              >
                G
              </span>
            </div>

            {/* Name - fades out when scrolled */}
            <span
              className={cn(
                'font-bold whitespace-nowrap hidden sm:block ml-3 transition-colors font-sans text-foreground',
                isScrolled ? 'opacity-0 w-0 ml-0' : 'opacity-100'
              )}
            >
              GREPR
            </span>
          </Link>

          {/* Center: Nav Items */}
          <ul
            className={cn(
              'hidden md:flex items-center justify-center flex-1 transition-colors',
              isScrolled ? 'gap-1' : 'gap-2'
            )}
          >
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'relative flex items-center justify-center rounded-full transition-all duration-300 py-2',
                      isActive
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-primary dark:hover:text-primary/80',
                      isScrolled ? 'px-2' : 'px-4'
                    )}
                  >
                    {/* Active indicator pill */}
                    {isActive && (
                      <motion.div
                        layoutId="nav-active-pill"
                        className="absolute inset-0 rounded-full bg-primary/10 dark:bg-primary/15"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    <Icon className="w-4 h-4 shrink-0 relative z-10" />
                    <span
                      className={cn(
                        'text-sm font-medium whitespace-nowrap transition-colors overflow-hidden relative z-10 font-sans',
                        isScrolled ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-2'
                      )}
                    >
                      {item.label}
                    </span>
                    {/* Active dot indicator - always visible */}
                    {isActive && (
                      <motion.div
                        layoutId="nav-active-dot"
                        className={cn(
                          'absolute left-1/2 -translate-x-1/2 rounded-full bg-primary',
                          isScrolled ? '-bottom-1 w-1.5 h-1.5' : '-bottom-2 w-2 h-2'
                        )}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Right: Theme + Profile + Mobile Menu */}
          <div
            className={cn(
              'flex items-center transition-colors',
              isScrolled ? 'gap-1' : 'gap-2'
            )}
          >
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={cn(
                'flex items-center justify-center rounded-full transition-colors shrink-0 hover:scale-110 active:scale-90 text-slate-600 dark:text-yellow-400 hover:bg-accent',
                isScrolled ? 'w-7 h-7' : 'w-9 h-9'
              )}
            >
              <motion.div
                className="transition-transform duration-500"
                animate={{ rotate: isDark ? 0 : 180 }}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </motion.div>
            </button>

            {/* Profile Link */}
            <Link
              href="/settings"
              className={cn(
                'hidden sm:flex items-center justify-center rounded-full transition-all shrink-0 hover:scale-105 active:scale-95',
                'bg-gradient-to-br from-primary to-primary/60',
                isScrolled ? 'w-7 h-7' : 'w-9 h-9'
              )}
            >
              <User className="w-4 h-4 text-primary-foreground" />
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={cn(
                'md:hidden flex items-center justify-center rounded-full transition-colors shrink-0 active:scale-90 text-muted-foreground hover:bg-accent',
                isScrolled ? 'w-7 h-7' : 'w-9 h-9'
              )}
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden"
            >
              <div
                className="pt-4 pb-2 border-t mt-3 border-border"
              >
                <ul className="flex flex-col gap-1">
                  {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-sans',
                            isActive
                              ? 'bg-primary/10 text-primary'
                              : 'text-muted-foreground hover:bg-accent'
                          )}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                  {/* Settings in mobile menu */}
                  <li>
                    <Link
                      href="/settings"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-sans',
                        pathname === '/settings'
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-accent'
                      )}
                    >
                      <Settings className="w-5 h-5" />
                      <span className="font-medium">Settings</span>
                    </Link>
                  </li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scroll Progress Bar */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary origin-left"
          style={{ scaleX }}
        />
      </motion.nav>
    </motion.header>
  );
}
