import { Post } from '@/types/post';

export interface ETFInfo {
  ticker: string;
  name: string;
  isin: string;
  provider: string;
  description: string;
  eligible: 'PEA' | 'CTO' | 'Both';
  ter: string;
  keywords: string[];
}

export const ETF_DATABASE: ETFInfo[] = [
  { ticker: 'CW8', name: 'Amundi MSCI World UCITS ETF', isin: 'LU1681043599', provider: 'Amundi', description: 'ETF World repliquant le MSCI World (1500+ actions pays developpés)', eligible: 'PEA', ter: '0.38%', keywords: ['cw8', 'amundi world', 'msci world amundi'] },
  { ticker: 'WPEA', name: 'iShares MSCI World Swap PEA UCITS ETF', isin: 'IE0002XZSHO1', provider: 'BlackRock (iShares)', description: 'ETF World BlackRock eligible PEA via swap synthetique', eligible: 'PEA', ter: '0.25%', keywords: ['wpea', 'ishares world pea', 'blackrock world'] },
  { ticker: 'DCAM', name: 'Amundi MSCI World II UCITS ETF', isin: 'FR0010315770', provider: 'Amundi', description: 'Alternative Amundi au CW8, eligible PEA', eligible: 'PEA', ter: '0.38%', keywords: ['dcam', 'amundi world 2'] },
  { ticker: 'EWLD', name: 'Lyxor PEA Monde (MSCI World) UCITS ETF', isin: 'FR0011869353', provider: 'Amundi (ex-Lyxor)', description: 'ETF World Lyxor eligible PEA', eligible: 'PEA', ter: '0.45%', keywords: ['ewld', 'lyxor world', 'lyxor pea monde'] },
  { ticker: 'PE500', name: 'Amundi PEA S&P 500 UCITS ETF', isin: 'FR0011871128', provider: 'Amundi', description: 'ETF repliquant le S&P 500 (500 plus grandes entreprises US)', eligible: 'PEA', ter: '0.15%', keywords: ['pe500', 'sp500', 's&p 500', 'amundi sp500'] },
  { ticker: 'PSP5', name: 'Lyxor PEA S&P 500 UCITS ETF', isin: 'FR0011871128', provider: 'Amundi (ex-Lyxor)', description: 'ETF S&P 500 eligible PEA', eligible: 'PEA', ter: '0.15%', keywords: ['psp5', 'lyxor sp500'] },
  { ticker: 'PCEU', name: 'Amundi PEA MSCI Europe UCITS ETF', isin: 'FR0013412038', provider: 'Amundi', description: 'ETF Europe (400+ actions europeennes)', eligible: 'PEA', ter: '0.15%', keywords: ['pceu', 'msci europe', 'europe etf'] },
  { ticker: 'STOXX600', name: 'Lyxor Stoxx Europe 600 UCITS ETF', isin: 'LU0908500753', provider: 'Amundi (ex-Lyxor)', description: 'ETF 600 plus grandes entreprises europeennes', eligible: 'PEA', ter: '0.07%', keywords: ['stoxx600', 'stoxx 600', 'europe 600'] },
  { ticker: 'PAEEM', name: 'Amundi PEA Emerging Markets UCITS ETF', isin: 'FR0013412020', provider: 'Amundi', description: 'ETF Marches Emergents (Chine, Inde, Bresil...)', eligible: 'PEA', ter: '0.20%', keywords: ['paeem', 'emerging', 'emergents', 'marches emergents'] },
  { ticker: 'PUST', name: 'Amundi PEA Nasdaq-100 UCITS ETF', isin: 'FR0013412269', provider: 'Amundi', description: 'ETF 100 plus grandes tech US (Apple, Microsoft, Google...)', eligible: 'PEA', ter: '0.23%', keywords: ['pust', 'nasdaq', 'nasdaq100', 'nasdaq 100', 'tech us'] },
  { ticker: 'PANX', name: 'Lyxor PEA Nasdaq-100 UCITS ETF', isin: 'FR0011871110', provider: 'Amundi (ex-Lyxor)', description: 'ETF Nasdaq-100 Lyxor eligible PEA', eligible: 'PEA', ter: '0.30%', keywords: ['panx', 'lyxor nasdaq'] },
  { ticker: 'CAC', name: 'Amundi CAC 40 UCITS ETF', isin: 'FR0007052782', provider: 'Amundi', description: 'ETF CAC 40 - 40 plus grandes entreprises francaises', eligible: 'PEA', ter: '0.25%', keywords: ['cac', 'cac40', 'cac 40'] },
  { ticker: 'PMEH', name: 'Amundi PEA PME (Small Caps France)', isin: 'FR0011770775', provider: 'Amundi', description: 'ETF PME francaises - petites et moyennes entreprises', eligible: 'PEA', ter: '0.50%', keywords: ['pmeh', 'pme', 'small caps france'] },
  { ticker: 'VWCE', name: 'Vanguard FTSE All-World UCITS ETF', isin: 'IE00BK5BQT80', provider: 'Vanguard', description: 'ETF World + Emergents (3900+ actions mondiales) - CTO uniquement', eligible: 'CTO', ter: '0.22%', keywords: ['vwce', 'vanguard world', 'ftse all world', 'vanguard'] },
  { ticker: 'IWDA', name: 'iShares Core MSCI World UCITS ETF', isin: 'IE00B4L5Y983', provider: 'BlackRock (iShares)', description: 'ETF World iShares - CTO uniquement', eligible: 'CTO', ter: '0.20%', keywords: ['iwda', 'ishares world', 'core msci world'] },
];

export interface ETFInsight {
  ticker: string;
  name: string;
  isin: string;
  provider: string;
  description: string;
  eligible: 'PEA' | 'CTO' | 'Both';
  ter: string;
  mentions: number;
  avgScore: number;
  posts: Post[];
  sentiment: 'positive' | 'neutral' | 'mixed';
}

export function getETFInsights(posts: Post[]): ETFInsight[] {
  const etfData: Record<string, { posts: Post[]; totalScore: number; etfInfo: ETFInfo }> = {};

  // Pre-compile word-boundary regex patterns once
  const etfPatterns = ETF_DATABASE.map(etfInfo => ({
    etfInfo,
    patterns: [etfInfo.ticker.toLowerCase(), ...etfInfo.keywords].map(keyword =>
      new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
    ),
  }));

  posts.forEach(post => {
    const searchText = `${post.title} ${post.tags || ''} ${post.summary || ''}`.toLowerCase();

    etfPatterns.forEach(({ etfInfo, patterns }) => {
      const matches = patterns.some(pattern => pattern.test(searchText));

      if (matches) {
        const key = etfInfo.ticker;
        if (!etfData[key]) {
          etfData[key] = { posts: [], totalScore: 0, etfInfo };
        }
        if (!etfData[key].posts.find(p => p.Id === post.Id)) {
          etfData[key].posts.push(post);
          etfData[key].totalScore += post.score || 0;
        }
      }
    });
  });

  return Object.entries(etfData)
    .map(([, data]) => {
      const avgScore = data.posts.length > 0 ? Math.round(data.totalScore / data.posts.length) : 0;
      let sentiment: 'positive' | 'neutral' | 'mixed' = 'neutral';
      if (avgScore > 100) sentiment = 'positive';
      else if (avgScore > 30) sentiment = 'neutral';
      else sentiment = 'mixed';

      return {
        ticker: data.etfInfo.ticker,
        name: data.etfInfo.name,
        isin: data.etfInfo.isin,
        provider: data.etfInfo.provider,
        description: data.etfInfo.description,
        eligible: data.etfInfo.eligible,
        ter: data.etfInfo.ter,
        mentions: data.posts.length,
        avgScore,
        posts: data.posts,
        sentiment,
      };
    })
    .filter(etf => etf.mentions >= 1)
    .sort((a, b) => b.mentions - a.mentions);
}
