export interface Post {
  Id: number;
  reddit_id: string;
  subreddit: string;
  title: string;
  selftext?: string;
  score: number;
  num_comments?: number;
  created_a?: string;
  created_utc?: number;
  url: string;
  author?: string;
  upvote_ratio?: number;
  category: string;
  tags?: string;
  summary?: string;
  consensus?: string;
  key_advice?: string;
  top_comment?: string;
  comment_score?: number;
  // Extracted financial data
  patrimoine?: number;
  revenus_annuels?: number;
  age_auteur?: number;
  montant_max?: number;
  montant_total?: number;
  etf_detected?: string[];
  CreatedAt?: string;
  UpdatedAt?: string;
}

// Format amount for display (100000 -> "100k€")
export function formatAmount(amount: number | null | undefined): string {
  if (!amount) return '-';
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M€`;
  }
  if (amount >= 1000) {
    return `${Math.round(amount / 1000)}k€`;
  }
  return `${amount}€`;
}

export const CATEGORIES = [
  'ETF',
  'Immobilier',
  'Crypto',
  'Epargne',
  'Fiscalite',
  'Actions',
  'Strategie',
  'Milestone',    // Success stories, réussites financières
  'Question',     // Demandes d'aide, cas pratiques
  'Retour XP',    // Retours d'expérience détaillés
  'Budget',       // Gestion de budget
  'Retraite',     // Préparation retraite
  'Credit',       // Crédits, prêts
  'Carriere',     // Salaire, négociation
  'Actualite',    // News financières
  'Autre'
] as const;

export type Category = typeof CATEGORIES[number];

export const CONSENSUS_COLORS: Record<string, { bg: string; label: string }> = {
  'fort': { bg: 'bg-green-500', label: 'Fort' },
  'moyen': { bg: 'bg-yellow-500', label: 'Moyen' },
  'faible': { bg: 'bg-orange-500', label: 'Faible' },
  'divisé': { bg: 'bg-red-500', label: 'Divisé' },
  'divise': { bg: 'bg-red-500', label: 'Divisé' },
};
