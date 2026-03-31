'use client';

import Link from 'next/link';
import { TrendingUp, Brain, Database, Zap, ArrowRight, BarChart3, Shield, Compass } from 'lucide-react';

const features = [
  { icon: TrendingUp, title: 'Intelligence Reddit', desc: 'Agregation automatique des meilleurs posts finance de 14 subreddits.' },
  { icon: Brain, title: 'Resumes par IA', desc: 'Categorisation, resumes et extraction de conseils cles via IA.' },
  { icon: Database, title: 'Classement ETF', desc: 'Les ETFs les plus mentionnes et recommandes par la communaute.' },
  { icon: BarChart3, title: 'Tableau Consensus', desc: 'Visualisez ou la communaute est d\'accord — et ou elle diverge.' },
  { icon: Zap, title: 'Digest Quotidien', desc: 'Les insights les plus importants, mis a jour chaque jour.' },
  { icon: Shield, title: 'Fonde sur les donnees', desc: 'Base sur des milliers de posts analyses, pas des opinions.' },
];

const stats = [
  { value: '650+', label: 'Posts analyses' },
  { value: '14', label: 'Subreddits' },
  { value: '40+', label: 'ETFs suivis' },
  { value: '24h', label: 'Mise a jour' },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-50 bg-background/90 backdrop-blur-sm">
        <Link href="/landing" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Compass className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">Grepr</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Connexion
          </Link>
          <Link
            href="/"
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            Decouvrir <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
        {/* Indigo glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-primary/5 blur-3xl" />

        <div className="relative max-w-3xl mx-auto text-center px-6 pt-28 pb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-8">
            <Zap className="w-3 h-3" />
            Intelligence financiere par IA
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight mb-6 text-foreground">
            Les meilleurs conseils finance de Reddit,{' '}
            <span className="text-gradient">analyses par IA</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            Grepr agregge et analyse des milliers de posts Reddit pour extraire tendances ETF, strategies d'investissement et conseils financiers.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
            >
              Decouvrir gratuitement <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              En savoir plus
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-muted/30">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-foreground">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Une plateforme complete pour suivre les conseils financiers de Reddit, sans effort.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="bg-card border border-border rounded-xl p-6 hover:shadow-md hover:border-primary/20 transition-all">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-sm font-bold mb-1.5 text-foreground">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-muted/30">
        <div className="max-w-3xl mx-auto px-6 py-24 text-center relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] rounded-full bg-primary/5 blur-3xl" />

          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground">
              Pret a commencer ?
            </h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
              Accedez gratuitement aux insights financiers extraits par l'IA depuis les meilleures communautes Reddit.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
            >
              Commencer gratuitement <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
