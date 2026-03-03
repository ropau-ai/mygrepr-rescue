'use client';

import { useState, useMemo } from 'react';
import { Post } from '@/types/post';
import { ETFInsight, getETFInsights } from '@/lib/nocodb';
import { Badge } from '@/components/ui/badge';
import { ETFDetailDialog } from './etf-detail-dialog';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ExternalLink,
  Star
} from 'lucide-react';

interface ETFComparisonProps {
  posts: Post[];
  onPostClick: (post: Post) => void;
  compact?: boolean;
}

function getSentimentIcon(sentiment: ETFInsight['sentiment']) {
  switch (sentiment) {
    case 'positive':
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    case 'neutral':
      return <Minus className="h-4 w-4 text-blue-400" />;
    case 'mixed':
      return <TrendingDown className="h-4 w-4 text-orange-500" />;
  }
}

function getSentimentLabel(sentiment: ETFInsight['sentiment']) {
  switch (sentiment) {
    case 'positive':
      return 'Populaire';
    case 'neutral':
      return 'Neutre';
    case 'mixed':
      return 'Divisé';
  }
}

function getSentimentColor(sentiment: ETFInsight['sentiment']) {
  switch (sentiment) {
    case 'positive':
      return 'text-green-500';
    case 'neutral':
      return 'text-blue-400';
    case 'mixed':
      return 'text-orange-500';
  }
}

export function ETFComparison({ posts, onPostClick, compact = false }: ETFComparisonProps) {
  const [showSection, setShowSection] = useState(true);
  const [copiedISIN, setCopiedISIN] = useState<string | null>(null);
  const [selectedETF, setSelectedETF] = useState<ETFInsight | null>(null);

  const etfInsights = useMemo(() => getETFInsights(posts), [posts]);

  // Sort by mentions and get top ETFs
  const rankedETFs = useMemo(() => {
    return etfInsights
      .sort((a, b) => {
        // First by sentiment (positive first)
        if (a.sentiment === 'positive' && b.sentiment !== 'positive') return -1;
        if (b.sentiment === 'positive' && a.sentiment !== 'positive') return 1;
        // Then by mentions
        return b.mentions - a.mentions;
      });
  }, [etfInsights]);

  const copyISIN = (isin: string) => {
    navigator.clipboard.writeText(isin);
    setCopiedISIN(isin);
    setTimeout(() => setCopiedISIN(null), 2000);
  };

  if (rankedETFs.length === 0) return null;

  // Determine "recommended" ETFs (positive sentiment + high mentions)
  const recommendedTickers = rankedETFs
    .filter(etf => etf.sentiment === 'positive' && etf.mentions >= 2)
    .map(etf => etf.ticker);

  // Compact mode - simple list
  if (compact) {
    const topETFs = rankedETFs.slice(0, 5);
    return (
      <>
        <div className="space-y-2">
          {topETFs.map((etf, index) => {
            const isRecommended = recommendedTickers.includes(etf.ticker);
            return (
              <button
                key={etf.ticker}
                onClick={() => setSelectedETF(etf)}
                className="w-full text-left p-3 rounded-lg hover:bg-accent/50 transition-colors group flex items-center gap-3"
              >
                <span className="text-lg font-bold text-muted-foreground/40 w-6 shrink-0">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {isRecommended && (
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    )}
                    <span className="font-medium group-hover:text-primary transition-colors">
                      {etf.ticker}
                    </span>
                    <Badge
                      className={`text-[10px] ${
                        etf.eligible === 'PEA'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-violet-500/20 text-violet-400'
                      }`}
                    >
                      {etf.eligible}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{etf.mentions} mentions</span>
                    <span>•</span>
                    <span className={
                      parseFloat(etf.ter) <= 0.25 ? 'text-emerald-400' :
                      parseFloat(etf.ter) <= 0.4 ? 'text-amber-400' : 'text-red-400'
                    }>
                      {etf.ter}
                    </span>
                    <span>•</span>
                    {getSentimentIcon(etf.sentiment)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <ETFDetailDialog
          etf={selectedETF}
          open={!!selectedETF}
          onClose={() => setSelectedETF(null)}
          onPostClick={onPostClick}
        />
      </>
    );
  }

  return (
    <div className="mb-6 bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setShowSection(!showSection)}
        className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-500" />
          <h2 className="text-lg font-semibold">Comparatif ETF</h2>
          <Badge variant="secondary" className="text-xs">
            {rankedETFs.length} analysés
          </Badge>
        </div>
        {showSection ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {/* Table */}
      {showSection && (
        <div className="px-4 pb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 font-medium text-muted-foreground">ETF</th>
                  <th className="pb-3 font-medium text-muted-foreground text-center">Mentions</th>
                  <th className="pb-3 font-medium text-muted-foreground text-center">Sentiment</th>
                  <th className="pb-3 font-medium text-muted-foreground text-center">Frais</th>
                  <th className="pb-3 font-medium text-muted-foreground text-center">Éligible</th>
                  <th className="pb-3 font-medium text-muted-foreground">ISIN</th>
                  <th className="pb-3 font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {rankedETFs.map((etf, index) => {
                  const isRecommended = recommendedTickers.includes(etf.ticker);
                  return (
                    <tr
                      key={etf.ticker}
                      onClick={() => setSelectedETF(etf)}
                      className={`border-b border-border/50 hover:bg-accent/20 cursor-pointer transition-colors ${
                        isRecommended ? 'bg-green-500/5' : ''
                      }`}
                    >
                      {/* ETF Name */}
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          {isRecommended && (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          )}
                          <div>
                            <div className="font-semibold flex items-center gap-1">
                              {etf.ticker}
                              {index === 0 && (
                                <Badge className="bg-yellow-500/20 text-yellow-600 text-xs ml-1">
                                  #1
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {etf.provider}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Mentions */}
                      <td className="py-3 text-center">
                        <span className="font-medium">{etf.mentions}</span>
                      </td>

                      {/* Sentiment */}
                      <td className="py-3">
                        <div className="flex items-center justify-center gap-1">
                          {getSentimentIcon(etf.sentiment)}
                          <span className={`text-xs ${getSentimentColor(etf.sentiment)}`}>
                            {getSentimentLabel(etf.sentiment)}
                          </span>
                        </div>
                      </td>

                      {/* Fees */}
                      <td className="py-3 text-center">
                        <span className={`font-sans text-xs ${
                          parseFloat(etf.ter) <= 0.25 ? 'text-green-500' :
                          parseFloat(etf.ter) <= 0.4 ? 'text-yellow-500' : 'text-orange-500'
                        }`}>
                          {etf.ter}
                        </span>
                      </td>

                      {/* Eligibility */}
                      <td className="py-3 text-center">
                        <Badge
                          className={`text-xs ${
                            etf.eligible === 'PEA'
                              ? 'bg-emerald-500/20 text-emerald-500'
                              : 'bg-violet-500/20 text-violet-500'
                          }`}
                        >
                          {etf.eligible}
                        </Badge>
                      </td>

                      {/* ISIN */}
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <code className="text-xs font-sans text-muted-foreground">
                            {etf.isin}
                          </code>
                          <button
                            onClick={() => copyISIN(etf.isin)}
                            className="p-1 hover:bg-accent rounded"
                            title="Copier ISIN"
                          >
                            {copiedISIN === etf.isin ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3">
                        <a
                          href={`https://www.justetf.com/fr/find-etf.html?query=${etf.isin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 hover:bg-accent rounded inline-flex"
                          title="Voir sur justETF"
                        >
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
              <span>Recommandé r/vosfinances</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span>Sentiment positif</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-green-500 font-sans">0.25%</span>
              <span>= Frais bas</span>
            </div>
            <div className="ml-auto text-muted-foreground/70">
              Cliquer sur un ETF pour plus de détails
            </div>
          </div>
        </div>
      )}

      {/* ETF Detail Dialog */}
      <ETFDetailDialog
        etf={selectedETF}
        open={!!selectedETF}
        onClose={() => setSelectedETF(null)}
        onPostClick={onPostClick}
      />
    </div>
  );
}
