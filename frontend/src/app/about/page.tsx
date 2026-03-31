import type { Metadata } from 'next';
import { Github, ExternalLink, TrendingUp, Brain, Database, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: "A propos de Grepr — Analyses financieres par IA",
  description: "Grepr agregge et analyse les conseils financiers des communautes Reddit. Categorisation IA, classement ETF, consensus communautaire.",
};

const features = [
  { icon: TrendingUp, title: 'Agregation Reddit', description: 'Collecte automatique depuis r/vosfinances, r/Bogleheads et d\'autres communautes finance.' },
  { icon: Brain, title: 'Analyse IA', description: 'Categorisation intelligente, resumes et extraction de conseils cles via Groq AI.' },
  { icon: Database, title: 'Base ETF', description: '40+ ETFs avec detection automatique des tickers dans les posts.' },
  { icon: Zap, title: 'Tableau de bord', description: 'Interface moderne pour explorer les tendances, comparer les ETFs et decouvrir les meilleurs conseils.' },
];

const techStack = [
  'Next.js', 'React 19', 'Tailwind CSS', 'Python', 'Groq AI', 'NocoDB',
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background pt-16 pb-16">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">
            A propos de Grepr
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Intelligence financiere par IA, extraite des communautes Reddit
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-base font-bold mb-3">
            Qu'est-ce que Grepr ?
          </h2>
          <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
            <p>Grepr agregge et analyse les conseils financiers des communautes Reddit francophones et anglophones.</p>
            <p>Notre objectif : faire remonter les meilleures pratiques d'investissement, les ETFs populaires et les strategies recommandees par la communaute.</p>
            <p>L'analyse est realisee par Groq AI (LLaMA 3.3 70B) pour la categorisation et les resumes.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="bg-card border border-border rounded-lg p-4">
                <Icon className="h-4 w-4 text-muted-foreground mb-2" />
                <h3 className="text-sm font-bold mb-1">{f.title}</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-base font-bold mb-3">Technologies</h2>
          <div className="flex flex-wrap gap-1.5">
            {techStack.map((t) => (
              <span key={t} className="px-2.5 py-1 rounded text-[11px] bg-muted text-muted-foreground">{t}</span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          <a href="https://github.com/Jelil-ah/mygrepr" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Github className="h-3.5 w-3.5" /> GitHub <ExternalLink className="h-3 w-3 opacity-50" />
          </a>
          <a href="https://reddit.com/r/vosfinances" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground transition-colors">
            r/vosfinances <ExternalLink className="h-3 w-3 opacity-50" />
          </a>
        </div>

        <p className="text-center text-[10px] mt-8 text-muted-foreground/60">
          Ce projet a un but educatif. Les informations presentees ne constituent pas un conseil financier.
        </p>
      </div>
    </main>
  );
}
