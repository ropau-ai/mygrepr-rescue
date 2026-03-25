import { Github, ExternalLink, TrendingUp, Brain, Database, Zap } from 'lucide-react';

const features = [
  { icon: TrendingUp, title: 'Reddit Aggregation', description: 'Automatic collection from r/vosfinances, r/Bogleheads and other finance communities.' },
  { icon: Brain, title: 'AI Analysis', description: 'Smart categorization, summaries and key advice extraction via Groq AI.' },
  { icon: Database, title: 'ETF Database', description: '40+ ETFs with automatic ticker detection in posts.' },
  { icon: Zap, title: 'Real-Time Dashboard', description: 'Modern interface to explore trends, compare ETFs and discover the best advice.' },
];

const techStack = [
  'Next.js', 'React 19', 'Tailwind CSS', 'Python', 'Groq AI', 'NocoDB',
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background pt-16 pb-16">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-serif), serif' }}>
            About Grepr
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            AI-powered financial intelligence from Reddit communities
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-base font-bold mb-3" style={{ fontFamily: 'var(--font-serif), serif' }}>
            What is Grepr?
          </h2>
          <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
            <p>Grepr aggregates and analyzes financial advice from French and English Reddit communities.</p>
            <p>Our goal is to surface the best investment practices, popular ETFs, and community-recommended strategies.</p>
            <p>Analysis is powered by Groq AI (LLaMA 3.3 70B) for categorization and summaries.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="bg-card border border-border rounded-lg p-4">
                <Icon className="h-4 w-4 text-muted-foreground mb-2" />
                <h3 className="text-sm font-bold mb-1" style={{ fontFamily: 'var(--font-serif), serif' }}>{f.title}</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-base font-bold mb-3" style={{ fontFamily: 'var(--font-serif), serif' }}>Tech Stack</h2>
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
          This project is for educational purposes. Information presented does not constitute financial advice.
        </p>
      </div>
    </main>
  );
}
