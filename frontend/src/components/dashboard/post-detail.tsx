'use client';

import { useEffect, useCallback, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Post, CATEGORY_COLORS, CONSENSUS_COLORS, parseExtractedData, formatAmount } from '@/types/post';
import { getTagsFromPost } from '@/lib/nocodb';
import { isPostFavorite, togglePostFavorite } from '@/lib/favorites';
import { ExternalLink, ChevronLeft, ChevronRight, Heart } from 'lucide-react';

interface PostDetailProps {
  post: Post | null;
  open: boolean;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  currentIndex?: number;
  totalCount?: number;
}

export function PostDetail({
  post,
  open,
  onClose,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
  currentIndex,
  totalCount
}: PostDetailProps) {

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowLeft' && hasPrev && onPrev) {
      e.preventDefault();
      onPrev();
    } else if (e.key === 'ArrowRight' && hasNext && onNext) {
      e.preventDefault();
      onNext();
    }
  }, [open, hasPrev, hasNext, onPrev, onNext]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const [isFavorite, setIsFavorite] = useState(false);

  // Check favorite status on mount and post change
  useEffect(() => {
    if (post?.reddit_id) {
      setIsFavorite(isPostFavorite(post.reddit_id));
    }
  }, [post?.reddit_id]);

  const handleToggleFavorite = () => {
    if (post?.reddit_id) {
      const newState = togglePostFavorite(post.reddit_id);
      setIsFavorite(newState);
    }
  };

  if (!post) return null;

  const tags = getTagsFromPost(post);
  const consensus = post.consensus?.toLowerCase();
  const consensusInfo = consensus ? CONSENSUS_COLORS[consensus] : null;
  const extractedData = parseExtractedData(post);

  // Check if there's any financial data to show
  const hasFinancialData = post.patrimoine || post.revenus_annuels || post.age_auteur ||
    post.montant_max || (extractedData?.amounts && extractedData.amounts.length > 0);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 gap-0 overflow-hidden min-w-0" showCloseButton={true}>
        {/* Navigation header */}
        {(onPrev || onNext) && (
          <div className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrev}
              disabled={!hasPrev}
              className="gap-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
              Préc
            </Button>
            {currentIndex !== undefined && totalCount !== undefined && (
              <span className="text-xs text-muted-foreground">
                {currentIndex + 1} / {totalCount}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onNext}
              disabled={!hasNext}
              className="gap-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              Suiv
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        <ScrollArea className="max-h-[calc(85vh-4rem)] min-w-0 w-full">
          <div className="px-6 py-6 overflow-hidden break-words">
            {/* Header with title and favorite */}
            <DialogHeader className="mb-6">
              <div className="flex items-start justify-between gap-3 pr-8">
                <DialogTitle className="text-left text-xl leading-tight flex-1">
                  {post.title}
                </DialogTitle>
                <button
                  onClick={handleToggleFavorite}
                  className={`p-2 rounded-lg transition-colors shrink-0 ${
                    isFavorite
                      ? 'text-red-500 bg-red-500/10'
                      : 'text-muted-foreground hover:text-red-500 hover:bg-red-500/10'
                  }`}
                  title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                >
                  <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
              </div>
            </DialogHeader>

            <Separator className="mb-6" />

            {/* Overview section */}
            {post.summary && (
              <div className="mb-6">
                <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 font-medium">
                  Résumé
                </h4>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {post.summary}
                </p>
              </div>
            )}

            {/* Key Advice */}
            {post.key_advice && (
              <div className="mb-6">
                <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 font-medium">
                  Conseil Clé
                </h4>
                <p className="text-sm leading-relaxed">
                  • {post.key_advice}
                </p>
              </div>
            )}

            {/* Tags */}
            <div className="mb-6">
              <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 font-medium">
                Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="text-xs bg-muted text-muted-foreground border-0"
                >
                  {post.category}
                </Badge>
                {tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {consensusInfo && (
                  <Badge variant="outline" className="text-xs">
                    {consensus === 'fort' && '🟢'}
                    {consensus === 'moyen' && '🟡'}
                    {consensus === 'faible' && '🟠'}
                    {(consensus === 'divisé' || consensus === 'divise') && '🔴'}
                    {' '}{consensusInfo.label}
                  </Badge>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="mb-6">
              <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 font-medium">
                Statistiques
              </h4>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <span>⬆️ {post.score} upvotes</span>
                <span>💬 {post.num_comments || 0} commentaires</span>
                <span>📅 {post.created_a?.split(' ')[0]}</span>
              </div>
            </div>

            {/* Financial Data */}
            {hasFinancialData && (
              <div className="mb-6">
                <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 font-medium">
                  Données Financières
                </h4>
                <div className="space-y-2 text-sm">
                  {post.patrimoine && (
                    <p>• <span className="text-muted-foreground">Patrimoine:</span> <span className="text-green-500 font-medium">{formatAmount(post.patrimoine)}</span></p>
                  )}
                  {post.revenus_annuels && (
                    <p>• <span className="text-muted-foreground">Revenus Annuels:</span> <span className="text-blue-500 font-medium">{formatAmount(post.revenus_annuels)}</span></p>
                  )}
                  {post.age_auteur && (
                    <p>• <span className="text-muted-foreground">Âge Auteur:</span> <span className="font-medium">{post.age_auteur} ans</span></p>
                  )}
                  {post.montant_max && (
                    <p>• <span className="text-muted-foreground">Montant Max:</span> <span className="text-emerald-500 font-medium">{formatAmount(post.montant_max)}</span></p>
                  )}
                </div>
                {extractedData?.amounts && extractedData.amounts.length > 1 && (
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-2">Montants mentionnés:</p>
                    <div className="flex flex-wrap gap-2">
                      {extractedData.amounts.map((amount, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {formatAmount(amount)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Original Content */}
            {post.selftext && (
              <div className="mb-6">
                <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 font-medium">
                  Contenu Original
                </h4>
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-all text-foreground/80">
                  {post.selftext}
                </p>
              </div>
            )}

            {/* Top Comment */}
            {post.top_comment && (
              <div className="mb-6">
                <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 font-medium">
                  Top Commentaire
                  {post.comment_score && (
                    <span className="ml-2 normal-case tracking-normal">
                      (⬆️ {post.comment_score})
                    </span>
                  )}
                </h4>
                <blockquote className="text-sm leading-relaxed italic border-l-2 border-muted-foreground/30 pl-4 text-foreground/80">
                  {post.top_comment}
                </blockquote>
              </div>
            )}

            <Separator className="my-6" />

            {/* Link to Reddit */}
            <Button variant="outline" className="w-full" asChild>
              <a href={post.url} target="_blank" rel="noopener noreferrer">
                Voir sur Reddit <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
