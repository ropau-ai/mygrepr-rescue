export interface ExtractedData {
  amounts: number[];
  patrimoine: number | null;
  revenus_annuels: number | null;
  revenus_mensuels: number | null;
  epargne_mensuelle: number | null;
  age: number | null;
  duree_annees: number | null;
}

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
  extracted_data?: string; // JSON string
  patrimoine?: number;
  revenus_annuels?: number;
  age_auteur?: number;
  montant_max?: number;
  montant_total?: number;
  etf_detected?: string[];
  CreatedAt?: string;
  UpdatedAt?: string;
}

// Helper to parse extracted_data JSON
export function parseExtractedData(post: Post): ExtractedData | null {
  if (!post.extracted_data) return null;
  try {
    return JSON.parse(post.extracted_data) as ExtractedData;
  } catch {
    return null;
  }
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

export type ViewType = 'table' | 'gallery';

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

export const CATEGORY_COLORS: Record<string, string> = {
  'ETF': 'bg-muted text-muted-foreground',
  'Immobilier': 'bg-muted text-muted-foreground',
  'Crypto': 'bg-muted text-muted-foreground',
  'Epargne': 'bg-muted text-muted-foreground',
  'Fiscalite': 'bg-muted text-muted-foreground',
  'Actions': 'bg-muted text-muted-foreground',
  'Strategie': 'bg-muted text-muted-foreground',
  'Milestone': 'bg-muted text-muted-foreground',
  'Question': 'bg-muted text-muted-foreground',
  'Retour XP': 'bg-muted text-muted-foreground',
  'Budget': 'bg-muted text-muted-foreground',
  'Retraite': 'bg-muted text-muted-foreground',
  'Credit': 'bg-muted text-muted-foreground',
  'Carriere': 'bg-muted text-muted-foreground',
  'Actualite': 'bg-muted text-muted-foreground',
  'Autre': 'bg-muted text-muted-foreground',
};

export const CONSENSUS_COLORS: Record<string, { bg: string; label: string }> = {
  'fort': { bg: 'bg-green-500', label: 'Fort' },
  'moyen': { bg: 'bg-yellow-500', label: 'Moyen' },
  'faible': { bg: 'bg-orange-500', label: 'Faible' },
  'divisé': { bg: 'bg-red-500', label: 'Divisé' },
  'divise': { bg: 'bg-red-500', label: 'Divisé' },
};
