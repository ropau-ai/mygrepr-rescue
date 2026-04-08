'use client';

import { Github, ExternalLink, TrendingUp, Brain, Database, Zap } from 'lucide-react';
import { useLanguage } from '@/components/language-provider';

const techStack = [
  'Next.js', 'React 19', 'Tailwind CSS', 'Python', 'Groq AI', 'NocoDB',
];

export default function AboutPage() {
  const { t } = useLanguage();

  const features = [
    { icon: TrendingUp, title: t('about.feat_aggregation'), description: t('about.feat_aggregation_desc') },
    { icon: Brain, title: t('about.feat_ai'), description: t('about.feat_ai_desc') },
    { icon: Database, title: t('about.feat_etf'), description: t('about.feat_etf_desc') },
    { icon: Zap, title: t('about.feat_dashboard'), description: t('about.feat_dashboard_desc') },
  ];

  return (
    <main className="min-h-screen bg-background pt-16 pb-16">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">
            {t('about.title')}
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            {t('about.subtitle')}
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-base font-bold mb-3">
            {t('about.what_is')}
          </h2>
          <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
            <p>{t('about.desc1')}</p>
            <p>{t('about.desc2')}</p>
            <p>{t('about.desc3')}</p>
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
          <h2 className="text-base font-bold mb-3">{t('about.technologies')}</h2>
          <div className="flex flex-wrap gap-1.5">
            {techStack.map((tech) => (
              <span key={tech} className="px-2.5 py-1 rounded text-[11px] bg-muted text-muted-foreground">{tech}</span>
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
          {t('about.disclaimer')}
        </p>
      </div>
    </main>
  );
}
