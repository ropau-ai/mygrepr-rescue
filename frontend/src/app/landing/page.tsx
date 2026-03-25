'use client';

import Link from 'next/link';
import { TrendingUp, Brain, Database, Zap, ArrowRight, BarChart3, Shield } from 'lucide-react';

const features = [
  { icon: TrendingUp, title: 'Reddit Intelligence', desc: 'Aggregation automatique des meilleurs posts finance de Reddit.' },
  { icon: Brain, title: 'AI-Powered Summaries', desc: 'Resumes, categorisation et extraction de conseils via IA.' },
  { icon: Database, title: 'ETF Rankings', desc: 'Classement des ETFs les plus mentionnes par la communaute.' },
  { icon: BarChart3, title: 'Consensus Board', desc: 'Visualisez ou la communaute est d\'accord — et ou elle diverge.' },
  { icon: Zap, title: 'Daily Digest', desc: 'Les insights les plus importants, mis a jour quotidiennement.' },
  { icon: Shield, title: 'Data-Driven', desc: 'Base sur des milliers de posts analyses, pas des opinions.' },
];

const stats = [
  { value: '650+', label: 'Posts analyses' },
  { value: '15+', label: 'ETFs suivis' },
  { value: '5', label: 'Subreddits sources' },
  { value: '24h', label: 'Mise a jour' },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#e8e6e1]">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-sm">
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-serif), serif' }}>
          Grepr
        </h1>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-xs text-[#888] hover:text-[#e8e6e1] transition-colors">
            Sign in
          </Link>
          <Link
            href="/login"
            className="px-3 py-1.5 rounded-md border border-white/20 text-xs font-medium hover:bg-white/5 transition-colors flex items-center gap-1"
          >
            Get started <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Dark grid background like Clerk */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
        {/* Diamond/geometric accent shapes */}
        <div className="absolute top-20 left-1/4 w-16 h-16 border border-white/5 rotate-45" />
        <div className="absolute top-40 right-1/4 w-12 h-12 border border-white/5 rotate-45" />
        <div className="absolute bottom-20 left-1/3 w-20 h-20 border border-white/5 rotate-45" />
        <div className="absolute top-32 right-1/3 w-8 h-8 border border-white/8 rotate-45" />
        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-500/5 blur-3xl" />

        <div className="relative max-w-4xl mx-auto text-center px-6 py-36">
          <h2
            className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight mb-6"
            style={{ fontFamily: 'var(--font-serif), serif' }}
          >
            More than aggregation,
            <br />
            Complete Financial Intelligence
          </h2>
          <p className="text-sm sm:text-base text-[#888] max-w-xl mx-auto mb-10 leading-relaxed">
            Grepr analyse des milliers de posts Reddit pour extraire les meilleurs conseils financiers, tendances ETF et strategies d'investissement — pour que vous n'ayez pas a le faire.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#7c5aff] text-white text-sm font-medium hover:bg-[#6b4ae0] transition-colors shadow-lg shadow-purple-500/20"
          >
            Start building for free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Trusted by / Stats */}
      <section className="border-y border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-serif), serif' }}>{s.value}</p>
                <p className="text-[11px] text-[#666] mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <h3 className="text-2xl sm:text-3xl font-bold mb-3" style={{ fontFamily: 'var(--font-serif), serif' }}>
            Tout ce dont vous avez besoin
          </h3>
          <p className="text-xs text-[#888]">
            Une plateforme complete pour suivre les conseils financiers de Reddit.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 hover:border-white/10 hover:bg-white/[0.05] transition-all">
                <Icon className="w-5 h-5 text-[#7c5aff] mb-3" />
                <h4 className="text-sm font-bold mb-1.5" style={{ fontFamily: 'var(--font-serif), serif' }}>{f.title}</h4>
                <p className="text-[11px] text-[#888] leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-24 text-center relative">
          {/* Subtle glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] rounded-full bg-purple-500/5 blur-3xl" />

          <div className="relative">
            <h3
              className="text-3xl sm:text-4xl font-bold mb-4"
              style={{ fontFamily: 'var(--font-serif), serif' }}
            >
              Pret a commencer?
            </h3>
            <p className="text-sm text-[#888] mb-8 max-w-md mx-auto">
              Rejoignez Grepr gratuitement et accedez aux insights financiers extraits par l'IA.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#7c5aff] text-white text-sm font-medium hover:bg-[#6b4ae0] transition-colors shadow-lg shadow-purple-500/20"
            >
              Creer un compte <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-8">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white rounded flex items-center justify-center text-[#0a0a0a] text-xs font-bold" style={{ fontFamily: 'var(--font-serif), serif' }}>G</div>
            <span className="text-sm font-bold" style={{ fontFamily: 'var(--font-serif), serif' }}>Grepr</span>
          </div>
          <p className="text-[11px] text-[#666]">&copy; 2026 Jelil Ahounou. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/about" className="text-[11px] text-[#666] hover:text-[#e8e6e1] transition-colors">About</Link>
            <Link href="/login" className="text-[11px] text-[#666] hover:text-[#e8e6e1] transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
