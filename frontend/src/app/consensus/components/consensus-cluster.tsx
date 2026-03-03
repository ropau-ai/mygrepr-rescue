'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Post } from '@/types/post';
import { ChevronDown, MessageSquare, ArrowUp, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ClusterData {
  category: string;
  posts: Post[];
  total: number;
  fort: number;
  moyen: number;
  faible: number;
  divise: number;
  consensusScore: number;
  dominantConsensus: string;
  keyAdvices: string[];
}

interface ConsensusClusterProps {
  cluster: ClusterData;
  isExpanded: boolean;
  onToggle: () => void;
  categoryColor: string;
}

function getScoreColor(score: number) {
  if (score >= 70) return 'text-green-600 dark:text-green-400';
  if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

function getScoreBg(score: number) {
  if (score >= 70) return 'bg-green-500/10';
  if (score >= 40) return 'bg-yellow-500/10';
  return 'bg-red-500/10';
}

export function ConsensusCluster({ cluster, isExpanded, onToggle, categoryColor }: ConsensusClusterProps) {
  const topPosts = cluster.posts
    .filter(p => p.consensus === 'fort')
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 5);

  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-4 transition-shadow cursor-pointer',
        isExpanded ? 'shadow-lg ring-1 ring-primary/20' : 'hover:shadow-md'
      )}
      onClick={onToggle}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={cn('w-3 h-3 rounded-full shrink-0', categoryColor)} />
          <h3 className="font-semibold text-foreground truncate">{cluster.category}</h3>
        </div>
        <div className={cn(
          'flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-bold shrink-0',
          getScoreBg(cluster.consensusScore),
          getScoreColor(cluster.consensusScore)
        )}>
          {cluster.consensusScore}%
        </div>
      </div>

      {/* Consensus bar */}
      <div className="mt-3 flex h-2 rounded-full overflow-hidden bg-muted">
        {cluster.fort > 0 && (
          <div className="bg-green-500" style={{ width: `${(cluster.fort / cluster.total) * 100}%` }} />
        )}
        {cluster.moyen > 0 && (
          <div className="bg-yellow-500" style={{ width: `${(cluster.moyen / cluster.total) * 100}%` }} />
        )}
        {cluster.faible > 0 && (
          <div className="bg-orange-500" style={{ width: `${(cluster.faible / cluster.total) * 100}%` }} />
        )}
        {cluster.divise > 0 && (
          <div className="bg-red-500" style={{ width: `${(cluster.divise / cluster.total) * 100}%` }} />
        )}
      </div>

      {/* Stats row */}
      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
        <span>{cluster.total} posts</span>
        <span>{cluster.fort} strong</span>
        {cluster.divise > 0 && <span>{cluster.divise} divided</span>}
      </div>

      {/* Key advice preview */}
      {cluster.keyAdvices.length > 0 && !isExpanded && (
        <p className="mt-3 text-sm text-muted-foreground line-clamp-2 italic">
          &ldquo;{cluster.keyAdvices[0]}&rdquo;
        </p>
      )}

      {/* Expand indicator */}
      <div className="mt-3 flex items-center justify-center">
        <ChevronDown className={cn(
          'h-4 w-4 text-muted-foreground transition-transform',
          isExpanded && 'rotate-180'
        )} />
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="pt-4 border-t mt-3 space-y-4">
              {/* Key advices */}
              {cluster.keyAdvices.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-2">
                    <Lightbulb className="h-3.5 w-3.5 text-yellow-500" />
                    Key Consensus Advice
                  </h4>
                  <ul className="space-y-1.5">
                    {cluster.keyAdvices.map((advice, i) => (
                      <li key={i} className="text-sm text-muted-foreground pl-3 border-l-2 border-green-500/40">
                        {advice}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Top posts */}
              {topPosts.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">
                    Top Consensus Posts
                  </h4>
                  <ul className="space-y-2">
                    {topPosts.map(post => (
                      <li key={post.reddit_id} className="text-sm">
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-foreground hover:text-primary transition-colors line-clamp-1"
                        >
                          {post.title}
                        </a>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-0.5">
                            <ArrowUp className="h-3 w-3" />
                            {post.score}
                          </span>
                          {post.num_comments && (
                            <span className="flex items-center gap-0.5">
                              <MessageSquare className="h-3 w-3" />
                              {post.num_comments}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
