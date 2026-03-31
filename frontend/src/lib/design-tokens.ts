// Centralized design tokens for Grepr
// Category colors, consensus colors, and shared visual constants

export const CATEGORY_TAG_COLORS: Record<string, string> = {
  'ETF': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  'Immobilier': 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  'Crypto': 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
  'Epargne': 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  'Fiscalite': 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
  'Actions': 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
  'Strategie': 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
  'Milestone': 'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400',
  'Question': 'bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400',
  'Retour XP': 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400',
  'Budget': 'bg-lime-50 text-lime-700 dark:bg-lime-500/10 dark:text-lime-400',
  'Retraite': 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
  'Credit': 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  'Carriere': 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400',
  'Actualite': 'bg-zinc-50 text-zinc-600 dark:bg-zinc-500/10 dark:text-zinc-400',
  'Autre': 'bg-gray-50 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400',
};

export const DEFAULT_TAG_COLOR = 'bg-gray-50 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400';

export function getCategoryColor(category: string): string {
  return CATEGORY_TAG_COLORS[category] || DEFAULT_TAG_COLOR;
}
