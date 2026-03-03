import { cn } from '@/lib/utils';
import { Github, ExternalLink, TrendingUp, Brain, Database, Zap } from 'lucide-react';

const features = [
  {
    icon: TrendingUp,
    title: 'Agrégation Reddit',
    description: 'Collecte automatique des meilleurs posts de r/vosfinances, r/Bogleheads et autres communautés finance.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Brain,
    title: 'Analyse IA',
    description: 'Catégorisation intelligente, résumés et extraction des conseils clés via Groq AI.',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    icon: Database,
    title: 'ETF Database',
    description: 'Base de données de 40+ ETF avec détection automatique des tickers mentionnés.',
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    icon: Zap,
    title: 'Dashboard Temps Réel',
    description: 'Interface moderne pour explorer les tendances, comparer les ETF et découvrir les meilleurs conseils.',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
  },
];

const techStack = [
  { name: 'Next.js', category: 'Frontend' },
  { name: 'React 19', category: 'Frontend' },
  { name: 'Tailwind CSS', category: 'Styling' },
  { name: 'Framer Motion', category: 'Animations' },
  { name: 'Python', category: 'Backend' },
  { name: 'PullPush.io', category: 'Reddit Data' },
  { name: 'Groq', category: 'AI API' },
  { name: 'NocoDB', category: 'Database' },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background pt-20 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 font-sans text-foreground">
            À propos de Grepr
          </h1>
          <p className="text-lg font-sans max-w-2xl mx-auto text-muted-foreground">
            Agrégateur intelligent de conseils financiers Reddit avec analyse IA
          </p>
        </div>

        {/* What is Grepr */}
        <div className="p-6 rounded-xl border mb-8 bg-card border-border">
          <h2 className="text-xl font-semibold mb-4 font-sans text-foreground">
            Qu&apos;est-ce que Grepr?
          </h2>
          <div className="space-y-3 font-sans text-sm text-muted-foreground">
            <p>
              Grepr est un projet personnel qui agrège et analyse les conseils financiers des communautés Reddit francophones et anglophones.
            </p>
            <p>
              L&apos;objectif est de faciliter la découverte des meilleures pratiques d&apos;investissement, ETF populaires, et stratégies recommandées par la communauté.
            </p>
            <p>
              Les analyses sont effectuées via l&apos;API Groq (LLaMA 3.3 70B) pour la catégorisation et les résumés.
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="p-5 rounded-xl border bg-card border-border"
              >
                <div className={cn('p-2 rounded-lg w-fit mb-3', feature.bg)}>
                  <Icon className={cn('h-5 w-5', feature.color)} />
                </div>
                <h3 className="font-semibold mb-2 font-sans text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm font-sans text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Tech Stack */}
        <div className="p-6 rounded-xl border mb-8 bg-card border-border">
          <h2 className="text-xl font-semibold mb-4 font-sans text-foreground">
            Stack Technique
          </h2>
          <div className="flex flex-wrap gap-2">
            {techStack.map((tech) => (
              <span
                key={tech.name}
                className="px-3 py-1.5 rounded-full text-xs font-sans bg-muted text-muted-foreground"
              >
                {tech.name}
              </span>
            ))}
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-4 justify-center">
          <a
            href="https://github.com/Jelil-ah/mygrepr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border font-sans text-sm transition-colors border-border hover:border-primary/50 text-muted-foreground"
          >
            <Github className="h-4 w-4" />
            GitHub
            <ExternalLink className="h-3 w-3 opacity-50" />
          </a>
          <a
            href="https://reddit.com/r/vosfinances"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border font-sans text-sm transition-colors border-border hover:border-primary/50 text-muted-foreground"
          >
            r/vosfinances
            <ExternalLink className="h-3 w-3 opacity-50" />
          </a>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs font-sans mt-8 text-muted-foreground/60">
          Ce projet est à but éducatif. Les informations présentées ne constituent pas des conseils financiers.
        </p>
      </div>
    </main>
  );
}
