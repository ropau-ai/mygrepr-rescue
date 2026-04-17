import { cn } from '@/lib/utils';

// Canonical Ropau 4-branch sparkle — matches ropau-ai-site/src/components/SparkleIcon.tsx.
// Single path so it scales crisp as an icon or as a decorative accent.
export function SparkleMark({
  className = '',
  size = 14,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <path d="M12 0C12 6.627 6.627 12 0 12c6.627 0 12 5.373 12 12 0-6.627 5.373-12 12-12-6.627 0-12-5.373-12-12Z" />
    </svg>
  );
}

// Small inline mark — used on post rows and article actions bar.
// Whispers "Ropau grafted this" without screaming.
export function RopauSigilPill({
  label = 'Débat',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-[0.12em]',
        'bg-[color:var(--ropau-crimson)]/10 text-[color:var(--ropau-crimson)]',
        'dark:bg-[color:var(--ropau-crimson)]/20 dark:text-[#FF6080]',
        className
      )}
    >
      <SparkleMark size={10} />
      {label}
    </span>
  );
}

// The larger stamp — used above the debate view as the grafted-by-Ropau watermark.
export function RopauSigilStamp({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em]',
        'text-[color:var(--ropau-crimson)] dark:text-[#FF6B85]',
        className
      )}
    >
      <SparkleMark size={12} />
      <span>Greffé par Ropau</span>
      <span className="h-px w-10 bg-[color:var(--ropau-crimson)]/50" />
    </div>
  );
}
