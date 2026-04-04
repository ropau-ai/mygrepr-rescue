'use client';

import React, { useState } from 'react';
import {
  ArrowUpRight,
  TrendingUp,
  Layers,
  Clock,
  ChevronRight,
  ChevronUp,
  Filter,
  BarChart3,
  Bookmark,
  MessageSquare,
  ExternalLink,
  Search,
  Globe,
  MoreHorizontal,
  ArrowBigUp,
  Wallet,
  Building2,
  PieChart,
  Coins,
  Newspaper,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================
// VIBE 1 — EDITORIAL
// NYT / The Verge meets Notion
// ============================================================

function Vibe1Editorial() {
  const [activeCategory, setActiveCategory] = useState('Tout');
  const categories = ['Tout', 'Immobilier', 'Bourse', 'Crypto', 'Impôts', 'Retraite', 'PEA', 'Livrets'];

  const featured = {
    category: 'Stratégie',
    source: 'r/vosfinances',
    time: 'Il y a 2h',
    title: "Optimisation fiscale 2024 : Pourquoi le PER devient incontournable pour les tranches à 30%",
    summary: "Analyse approfondie des nouveaux plafonds de déduction et simulation comparative entre PEA et PER selon votre horizon de sortie.",
    upvotes: 452,
  };

  const posts = [
    { category: 'Bourse', source: 'r/france_eco', title: "L'inflation reflue plus vite que prévu en zone euro : impacts sur les taux", upvotes: 128, time: '45min' },
    { category: 'Immobilier', source: 'r/immobilier', title: "Le marché parisien stagne : opportunité de négociation ou début de baisse ?", upvotes: 89, time: '3h' },
    { category: 'Crypto', source: 'r/crypto_fr', title: "ETF Ethereum : Ce qu'il faut savoir sur la fiscalité des dividendes synthétiques", upvotes: 215, time: '5h' },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto p-6 md:p-12 bg-[#fcfcfc] text-slate-900 min-h-[80vh] font-sans">
      <header className="mb-10 border-b border-slate-200 pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-slate-500">Mise à jour directe</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
              Vibe 1 <span className="text-indigo-600">—</span> Editorial
            </h1>
          </div>
          <div className="flex items-center gap-6 text-slate-500">
            {[{ label: 'Sources', value: '14' }, { label: 'Articles / 24h', value: '124' }].map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <div className="w-px h-8 bg-slate-200" />}
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest font-bold mb-1">{s.label}</p>
                  <p className="text-lg font-medium text-slate-900 tabular-nums">{s.value}</p>
                </div>
              </React.Fragment>
            ))}
            <div className="w-px h-8 bg-slate-200" />
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest font-bold mb-1 text-indigo-600">Sentiment</p>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <p className="text-lg font-bold text-slate-900">Haussier</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav className="flex items-center gap-1 mb-10 overflow-x-auto pb-2">
        <div className="flex items-center gap-2 pr-4 border-r border-slate-200 mr-2">
          <Filter className="w-4 h-4 text-slate-400" />
        </div>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-4 py-1.5 text-sm font-medium transition-all whitespace-nowrap rounded-full border",
              activeCategory === cat
                ? "bg-slate-900 text-white border-slate-900"
                : "text-slate-500 border-transparent hover:border-slate-200"
            )}
          >
            {cat}
          </button>
        ))}
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-12">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600">À la une aujourd'hui</h2>
              <div className="h-px flex-1 mx-4 bg-slate-100" />
            </div>
            <article className="group cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-sm border bg-indigo-50 border-indigo-100 text-indigo-700">{featured.category}</span>
                <span className="text-xs font-medium text-slate-400">{featured.source}</span>
                <span className="text-slate-200">•</span>
                <span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {featured.time}</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold leading-tight group-hover:text-indigo-600 transition-colors">{featured.title}</h3>
              <p className="text-slate-600 leading-relaxed text-lg max-w-2xl mt-3">{featured.summary}</p>
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <BarChart3 className="w-4 h-4 text-emerald-500" />
                  <span>{featured.upvotes} votes</span>
                </div>
                <button className="flex items-center gap-1 text-sm font-bold text-indigo-600 hover:gap-2 transition-all">
                  Lire la suite <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </article>
          </section>
        </div>

        <aside className="lg:col-span-4 lg:border-l lg:border-slate-200 lg:pl-10">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
            Dernières minutes
            <span className="flex-1 h-[1px] bg-slate-100" />
          </h2>
          <div className="space-y-8">
            {posts.map((post, i) => (
              <article key={i} className="group cursor-pointer border-b border-slate-100 pb-6 last:border-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{post.category}</span>
                  <span className="text-[10px] text-slate-400 font-medium uppercase">Il y a {post.time}</span>
                </div>
                <h4 className="text-sm font-bold leading-relaxed group-hover:underline underline-offset-4 decoration-indigo-300">{post.title}</h4>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] font-bold text-slate-400">{post.source}</span>
                  <span className="text-[10px] font-bold text-emerald-500">+{post.upvotes}</span>
                </div>
              </article>
            ))}
          </div>
          <button className="w-full mt-6 py-3 border border-slate-200 text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
            Voir tout le flux <ChevronRight className="w-4 h-4" />
          </button>
        </aside>
      </div>
    </div>
  );
}

// ============================================================
// VIBE 2 — DENSE WIRE
// Hacker News + Techmeme density
// ============================================================

function Vibe2DenseWire() {
  const [activeFilter, setActiveFilter] = useState('Top');
  const posts = [
    { rank: 1, upvotes: 452, title: "L'inflation en zone euro ralentit à 2,4% en mars", source: 'r/vosfinances', category: 'Macro', time: '14m', comments: 89 },
    { rank: 2, upvotes: 312, title: "Pourquoi la hausse des taux de la BCE favorise les banques françaises", source: 'r/france_eco', category: 'Bourse', time: '42m', comments: 54 },
    { rank: 3, upvotes: 215, title: "Analyse : Le CAC 40 franchit un nouveau record historique", source: 'r/bourse', category: 'Indices', time: '1h', comments: 120 },
    { rank: 4, upvotes: 187, title: "Loi Pacte II : les changements majeurs pour l'épargne salariale", source: 'r/vosfinances', category: 'Législation', time: '2h', comments: 31 },
    { rank: 5, upvotes: 94, title: "Bitcoin : les ETF Spot voient une décollecte massive ce matin", source: 'r/crypto_fr', category: 'Crypto', time: '3h', comments: 212 },
  ];

  return (
    <div className="min-h-[80vh] bg-[#fcfcfc] text-[#1a1a1a] font-sans p-4">
      <div className="max-w-4xl mx-auto border border-gray-200 bg-white shadow-sm overflow-hidden rounded-sm">
        <header className="bg-white border-b border-gray-100 px-3 py-1 flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-gray-400">
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5 border-r border-gray-100 pr-4">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Direct / Grepr
            </span>
          </div>
          <span>{new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} Paris</span>
        </header>

        <nav className="border-b border-gray-100 p-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-black tracking-tighter text-indigo-600">Vibe 2 — Dense Wire</h1>
            <div className="flex border-l border-gray-200 ml-2 pl-4 gap-1">
              {['Top', 'Nouveau', 'Show', 'Ask'].map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={cn(
                    'px-2 py-0.5 text-[12px] font-medium rounded-sm transition-all',
                    activeFilter === f ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input type="text" placeholder="Rechercher..." className="bg-gray-50 border border-gray-200 py-1 pl-8 pr-3 text-xs rounded-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/20 w-48" />
          </div>
        </nav>

        <section className="divide-y divide-gray-50">
          {posts.map((post) => (
            <div key={post.rank} className="group flex items-start px-3 py-2 hover:bg-indigo-50/30 transition-colors">
              <div className="flex flex-col items-center w-10 shrink-0 pt-0.5">
                <span className="text-[11px] font-mono text-gray-300 font-bold mb-1">{String(post.rank).padStart(2, '0')}</span>
                <ChevronUp className="w-4 h-4 text-gray-300" />
                <span className="text-[10px] font-mono font-bold text-gray-500">{post.upvotes}</span>
              </div>
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex flex-wrap items-baseline gap-2 mb-0.5">
                  <h3 className="text-sm font-bold text-gray-900 tracking-tight leading-snug group-hover:text-indigo-900 transition-colors cursor-pointer">{post.title}</h3>
                  <span className="text-[10px] text-gray-400">({post.source})</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-gray-500">
                  <span className="bg-gray-100 text-gray-600 px-1.5 rounded-[2px] font-mono text-[9px] uppercase font-semibold">{post.category}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-gray-300" />{post.time}</span>
                  <span className="text-gray-300">•</span>
                  <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{post.comments}</span>
                </div>
              </div>
            </div>
          ))}
        </section>

        <footer className="border-t border-gray-100 p-4 flex flex-col items-center gap-3 bg-gray-50/50">
          <button className="text-xs font-mono font-bold text-indigo-600 hover:underline flex items-center gap-1">
            VOIR PLUS <TrendingUp className="w-3 h-3" />
          </button>
        </footer>
      </div>
    </div>
  );
}

// ============================================================
// VIBE 3 — CARD GRID
// Panda + Feedly soft cards
// ============================================================

function Vibe3CardGrid() {
  const [activeTab, setActiveTab] = useState('all');
  const tabs = [
    { id: 'all', label: 'Tout flux', icon: Newspaper },
    { id: 'markets', label: 'Marchés', icon: TrendingUp },
    { id: 'crypto', label: 'Crypto', icon: Coins },
    { id: 'immo', label: 'Immobilier', icon: Building2 },
    { id: 'banking', label: 'Banque', icon: Wallet },
    { id: 'macro', label: 'Économie', icon: Globe },
  ];

  const cards = [
    { category: 'Marchés', source: 'Boursorama', icon: 'B', title: 'CAC 40 : La barre des 8000 points est devenue un support psychologique majeur', excerpt: "Les analystes scrutent les volumes d'échange alors que l'indice consolide.", upvotes: 452, comments: 28, time: '12m' },
    { category: 'Crypto', source: 'Journal du Coin', icon: 'J', title: "Ethereum : L'impact de la mise à jour Dencun sur les frais de layer 2", excerpt: 'Réductions de coûts pour les utilisateurs d\'Optimism et Arbitrum.', upvotes: 890, comments: 54, time: '45m' },
    { category: 'Immobilier', source: 'Le Figaro', icon: 'F', title: 'Crédit Immobilier : Les taux commencent enfin leur décrue ?', excerpt: 'Baisses de 10 à 20 points de base chez les banques de réseau.', upvotes: 215, comments: 12, time: '1h' },
    { category: 'Économie', source: 'Les Échos', icon: 'E', title: "Inflation en France : L'Insee confirme le ralentissement à 2,3%", excerpt: "Le prix de l'énergie soulage le panier des ménages.", upvotes: 341, comments: 19, time: '2h' },
    { category: 'Banque', source: 'MoneyVox', icon: 'M', title: "Livret A : Gel prolongé du taux à 3% jusqu'en 2025 ?", excerpt: 'Le gouvernement s\'interroge malgré la baisse de l\'inflation.', upvotes: 1102, comments: 87, time: '3h' },
    { category: 'Actions', source: 'ZoneBourse', icon: 'Z', title: 'LVMH vs Hermès : Le duel du luxe face au ralentissement chinois', excerpt: 'Comparaison des stratégies de résilience des deux géants.', upvotes: 156, comments: 9, time: '4h' },
  ];

  return (
    <section className="bg-[#f8fafc] min-h-[80vh] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Vibe 3 — Card Grid</h2>
            <p className="text-slate-500 font-medium">L'essentiel de la finance en un coup d'oeil.</p>
          </div>
        </header>

        <div className="relative overflow-hidden mb-8 rounded-[2rem] bg-indigo-600 p-8 shadow-xl shadow-indigo-200">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-50" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <span className="text-indigo-100 text-sm font-bold uppercase tracking-[0.2em]">Tendance de Marché</span>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-3xl font-black text-white">+2.45%</span>
                <span className="bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded text-xs font-bold border border-emerald-400/30">CAC 40</span>
              </div>
            </div>
            <div className="hidden lg:flex gap-12">
              {[{ label: 'Articles', value: '142' }, { label: 'Analystes', value: '24' }, { label: 'Sujets', value: '8' }].map((s, i) => (
                <div key={i} className="flex flex-col border-l border-indigo-500/50 pl-6">
                  <span className="text-white text-xl font-black">{s.value}</span>
                  <span className="text-indigo-100/70 text-xs font-medium">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-10 overflow-x-auto pb-4 flex items-center gap-3">
          {tabs.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-full transition-all whitespace-nowrap text-sm font-medium border',
                  activeTab === cat.id
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                )}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {cards.map((item, i) => (
            <article key={i} className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 flex flex-col h-full overflow-hidden hover:-translate-y-1">
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-4">
                  <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">{item.category}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200">{item.icon}</div>
                    <span className="text-xs font-medium text-slate-400">{item.source}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-[17px] font-bold text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">{item.excerpt}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between text-slate-400">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-xs font-semibold"><ArrowBigUp className="w-4 h-4" />{item.upvotes}</span>
                    <span className="flex items-center gap-1.5 text-xs font-semibold"><MessageSquare className="w-4 h-4" />{item.comments}</span>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-medium uppercase"><Clock className="w-3.5 h-3.5" />{item.time}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// PAGE — All 3 Vibes stacked
// ============================================================

export default function VibesPage() {
  return (
    <div className="min-h-screen">
      {/* Vibe selector header */}
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-black">Design Vibes — Choisis ton style</h1>
          <div className="flex gap-3">
            <a href="#vibe1" className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 transition-colors">1. Editorial</a>
            <a href="#vibe2" className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 transition-colors">2. Dense Wire</a>
            <a href="#vibe3" className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 transition-colors">3. Card Grid</a>
          </div>
        </div>
      </div>

      {/* Vibe 1 */}
      <div id="vibe1" className="border-b-4 border-indigo-600">
        <Vibe1Editorial />
      </div>

      {/* Vibe 2 */}
      <div id="vibe2" className="border-b-4 border-indigo-600">
        <Vibe2DenseWire />
      </div>

      {/* Vibe 3 */}
      <div id="vibe3" className="border-b-4 border-indigo-600">
        <Vibe3CardGrid />
      </div>
    </div>
  );
}
