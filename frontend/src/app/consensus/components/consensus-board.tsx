'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Post, CATEGORIES, CATEGORY_COLORS } from '@/types/post';
import { ConsensusCluster, type ClusterData } from './consensus-cluster';
import { BarChart3, Filter, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ConsensusFilter = 'all' | 'fort' | 'moyen' | 'faible' | 'divise';

interface ConsensusBoardProps {
  posts: Post[];
}

export function ConsensusBoard({ posts }: ConsensusBoardProps) {
  const [filter, setFilter] = useState<ConsensusFilter>('all');
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);

  const clusters = useMemo(() => {
    const grouped: Record<string, Post[]> = {};

    posts.forEach(post => {
      if (!post.category || !post.consensus) return;
      if (!grouped[post.category]) grouped[post.category] = [];
      grouped[post.category].push(post);
    });

    return Object.entries(grouped)
      .map(([category, categoryPosts]): ClusterData => {
        const total = categoryPosts.length;
        const fort = categoryPosts.filter(p => p.consensus === 'fort').length;
        const moyen = categoryPosts.filter(p => p.consensus === 'moyen').length;
        const faible = categoryPosts.filter(p => p.consensus === 'faible').length;
        const divise = categoryPosts.filter(p => p.consensus === 'divisé' || p.consensus === 'divise').length;

        const consensusScore = total > 0
          ? Math.round(((fort * 100 + moyen * 60 + faible * 30) / (total * 100)) * 100)
          : 0;

        const dominantConsensus = fort >= moyen && fort >= faible && fort >= divise
          ? 'fort'
          : moyen >= faible && moyen >= divise
            ? 'moyen'
            : faible >= divise
              ? 'faible'
              : 'divise';

        // Extract top key advices
        const keyAdvices = categoryPosts
          .filter(p => p.key_advice && p.consensus === 'fort')
          .sort((a, b) => (b.score || 0) - (a.score || 0))
          .slice(0, 3)
          .map(p => p.key_advice!);

        return {
          category,
          posts: categoryPosts,
          total,
          fort,
          moyen,
          faible,
          divise,
          consensusScore,
          dominantConsensus,
          keyAdvices,
        };
      })
      .filter(c => c.total >= 2)
      .sort((a, b) => b.total - a.total);
  }, [posts]);

  const filteredClusters = useMemo(() => {
    if (filter === 'all') return clusters;
    return clusters.filter(c => c.dominantConsensus === filter);
  }, [clusters, filter]);

  const stats = useMemo(() => {
    const total = clusters.reduce((sum, c) => sum + c.total, 0);
    const highConsensus = clusters.filter(c => c.consensusScore >= 70).length;
    const contested = clusters.filter(c => c.consensusScore < 40).length;
    return { total, topics: clusters.length, highConsensus, contested };
  }, [clusters]);

  return (
    <div className="min-h-screen pt-24 pb-24 px-4 sm:px-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
          <BarChart3 className="h-7 w-7 text-primary" />
          Consensus Board
        </h1>
        <p className="text-muted-foreground mt-2">
          Where the community actually agrees — consensus across {stats.topics} topics.
        </p>
      </motion.div>

      {/* Summary bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-3 mb-6"
      >
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-sm">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>{stats.total} posts analyzed</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 text-sm">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>{stats.highConsensus} high consensus</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 text-red-700 dark:text-red-400 text-sm">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>{stats.contested} contested</span>
        </div>
      </motion.div>

      {/* Filter bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex items-center gap-2 mb-8 overflow-x-auto pb-2"
      >
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
        {(['all', 'fort', 'moyen', 'faible', 'divise'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            )}
          >
            {f === 'all' ? 'All' : f === 'fort' ? 'Strong' : f === 'moyen' ? 'Moderate' : f === 'faible' ? 'Weak' : 'Divided'}
          </button>
        ))}
      </motion.div>

      {/* Cluster grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredClusters.map((cluster, i) => (
            <motion.div
              key={cluster.category}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
            >
              <ConsensusCluster
                cluster={cluster}
                isExpanded={expandedCluster === cluster.category}
                onToggle={() => setExpandedCluster(
                  expandedCluster === cluster.category ? null : cluster.category
                )}
                categoryColor={CATEGORY_COLORS[cluster.category] || 'bg-gray-500'}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredClusters.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>No topics match this filter.</p>
        </div>
      )}
    </div>
  );
}
