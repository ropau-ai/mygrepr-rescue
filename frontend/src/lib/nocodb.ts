import { Post } from '@/types/post';

// Server-side only: these MUST NOT have the NEXT_PUBLIC_ prefix to prevent client-side exposure
const MAX_PAGINATION_ITERATIONS = 20;

function getEnvConfig() {
  const baseUrl = process.env.NOCODB_URL;
  const token = process.env.NOCODB_TOKEN;
  const tableId = process.env.NOCODB_TABLE_ID;

  if (!baseUrl || !token || !tableId) {
    throw new Error('Missing required NOCODB environment variables. Ensure NOCODB_URL, NOCODB_TOKEN, NOCODB_TABLE_ID are set.');
  }

  return { baseUrl, token, tableId };
}

export async function fetchPosts(): Promise<Post[]> {
  const { baseUrl, token, tableId } = getEnvConfig();
  const url = `${baseUrl}/api/v2/tables/${tableId}/records`;
  const allPosts: Post[] = [];
  let offset = 0;
  const limit = 1000;
  let iterations = 0;

  try {
    while (iterations < MAX_PAGINATION_ITERATIONS) {
      iterations++;
      const response = await fetch(`${url}?limit=${limit}&offset=${offset}`, {
        headers: {
          'xc-token': token,
        },
        next: { revalidate: 300 },
      });

      if (!response.ok) {
        console.error('Failed to fetch posts:', response.status);
        break;
      }

      const data = await response.json();
      const records = data.list || [];

      if (records.length === 0) break;

      const validRecords = records.filter((post: Post) =>
        post.title && post.reddit_id
      );

      allPosts.push(...validRecords);

      if (records.length < limit) break;
      offset += limit;
    }
  } catch (error) {
    console.error('Database fetch error');
    return [];
  }

  return allPosts;
}

export function getTagsFromPost(post: Post): string[] {
  if (!post.tags) return [];
  return post.tags.split(',').map(tag => tag.trim()).filter(Boolean);
}

export function getTrendingTags(posts: Post[]): { tag: string; count: number }[] {
  const tagCounts: Record<string, number> = {};

  posts.forEach(post => {
    const tags = getTagsFromPost(post);
    tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  return Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

export function getCategoryStats(posts: Post[]): { category: string; count: number }[] {
  const categoryCounts: Record<string, number> = {};

  posts.forEach(post => {
    const category = post.category || 'Autre';
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  return Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

// ETF Database with ISIN codes and details
export interface ETFInfo {
  ticker: string;
  name: string;
  isin: string;
  provider: string;
  description: string;
  eligible: 'PEA' | 'CTO' | 'Both';
  ter: string; // Total Expense Ratio
  keywords: string[]; // Alternative names to search
}

export const ETF_DATABASE: ETFInfo[] = [
  // World ETFs - PEA
  {
    ticker: 'CW8',
    name: 'Amundi MSCI World UCITS ETF',
    isin: 'LU1681043599',
    provider: 'Amundi',
    description: 'ETF World repliquant le MSCI World (1500+ actions pays developpés)',
    eligible: 'PEA',
    ter: '0.38%',
    keywords: ['cw8', 'amundi world', 'msci world amundi'],
  },
  {
    ticker: 'WPEA',
    name: 'iShares MSCI World Swap PEA UCITS ETF',
    isin: 'IE0002XZSHO1',
    provider: 'BlackRock (iShares)',
    description: 'ETF World BlackRock eligible PEA via swap synthetique',
    eligible: 'PEA',
    ter: '0.25%',
    keywords: ['wpea', 'ishares world pea', 'blackrock world'],
  },
  {
    ticker: 'DCAM',
    name: 'Amundi MSCI World II UCITS ETF',
    isin: 'FR0010315770',
    provider: 'Amundi',
    description: 'Alternative Amundi au CW8, eligible PEA',
    eligible: 'PEA',
    ter: '0.38%',
    keywords: ['dcam', 'amundi world 2'],
  },
  {
    ticker: 'EWLD',
    name: 'Lyxor PEA Monde (MSCI World) UCITS ETF',
    isin: 'FR0011869353',
    provider: 'Amundi (ex-Lyxor)',
    description: 'ETF World Lyxor eligible PEA',
    eligible: 'PEA',
    ter: '0.45%',
    keywords: ['ewld', 'lyxor world', 'lyxor pea monde'],
  },
  // S&P 500
  {
    ticker: 'PE500',
    name: 'Amundi PEA S&P 500 UCITS ETF',
    isin: 'FR0011871128',
    provider: 'Amundi',
    description: 'ETF repliquant le S&P 500 (500 plus grandes entreprises US)',
    eligible: 'PEA',
    ter: '0.15%',
    keywords: ['pe500', 'sp500', 's&p 500', 'amundi sp500'],
  },
  {
    ticker: 'PSP5',
    name: 'Lyxor PEA S&P 500 UCITS ETF',
    isin: 'FR0011871128',
    provider: 'Amundi (ex-Lyxor)',
    description: 'ETF S&P 500 eligible PEA',
    eligible: 'PEA',
    ter: '0.15%',
    keywords: ['psp5', 'lyxor sp500'],
  },
  // Europe
  {
    ticker: 'PCEU',
    name: 'Amundi PEA MSCI Europe UCITS ETF',
    isin: 'FR0013412038',
    provider: 'Amundi',
    description: 'ETF Europe (400+ actions europeennes)',
    eligible: 'PEA',
    ter: '0.15%',
    keywords: ['pceu', 'msci europe', 'europe etf'],
  },
  {
    ticker: 'STOXX600',
    name: 'Lyxor Stoxx Europe 600 UCITS ETF',
    isin: 'LU0908500753',
    provider: 'Amundi (ex-Lyxor)',
    description: 'ETF 600 plus grandes entreprises europeennes',
    eligible: 'PEA',
    ter: '0.07%',
    keywords: ['stoxx600', 'stoxx 600', 'europe 600'],
  },
  // Emerging Markets
  {
    ticker: 'PAEEM',
    name: 'Amundi PEA Emerging Markets UCITS ETF',
    isin: 'FR0013412020',
    provider: 'Amundi',
    description: 'ETF Marches Emergents (Chine, Inde, Bresil...)',
    eligible: 'PEA',
    ter: '0.20%',
    keywords: ['paeem', 'emerging', 'emergents', 'em'],
  },
  // NASDAQ
  {
    ticker: 'PUST',
    name: 'Amundi PEA Nasdaq-100 UCITS ETF',
    isin: 'FR0013412269',
    provider: 'Amundi',
    description: 'ETF 100 plus grandes tech US (Apple, Microsoft, Google...)',
    eligible: 'PEA',
    ter: '0.23%',
    keywords: ['pust', 'nasdaq', 'nasdaq100', 'nasdaq 100', 'tech us'],
  },
  {
    ticker: 'PANX',
    name: 'Lyxor PEA Nasdaq-100 UCITS ETF',
    isin: 'FR0011871110',
    provider: 'Amundi (ex-Lyxor)',
    description: 'ETF Nasdaq-100 Lyxor eligible PEA',
    eligible: 'PEA',
    ter: '0.30%',
    keywords: ['panx', 'lyxor nasdaq'],
  },
  // French Tech / CAC 40
  {
    ticker: 'CAC',
    name: 'Amundi CAC 40 UCITS ETF',
    isin: 'FR0007052782',
    provider: 'Amundi',
    description: 'ETF CAC 40 - 40 plus grandes entreprises francaises',
    eligible: 'PEA',
    ter: '0.25%',
    keywords: ['cac', 'cac40', 'cac 40', 'france'],
  },
  {
    ticker: 'PMEH',
    name: 'Amundi PEA PME (Small Caps France)',
    isin: 'FR0011770775',
    provider: 'Amundi',
    description: 'ETF PME francaises - petites et moyennes entreprises',
    eligible: 'PEA',
    ter: '0.50%',
    keywords: ['pmeh', 'pme', 'small caps france', 'french tech'],
  },
  // CTO Only - Popular ones
  {
    ticker: 'VWCE',
    name: 'Vanguard FTSE All-World UCITS ETF',
    isin: 'IE00BK5BQT80',
    provider: 'Vanguard',
    description: 'ETF World + Emergents (3900+ actions mondiales) - CTO uniquement',
    eligible: 'CTO',
    ter: '0.22%',
    keywords: ['vwce', 'vanguard world', 'ftse all world', 'vanguard'],
  },
  {
    ticker: 'IWDA',
    name: 'iShares Core MSCI World UCITS ETF',
    isin: 'IE00B4L5Y983',
    provider: 'BlackRock (iShares)',
    description: 'ETF World iShares - CTO uniquement',
    eligible: 'CTO',
    ter: '0.20%',
    keywords: ['iwda', 'ishares world', 'core msci world'],
  },
];

// Extract keywords for searching
const ETF_SEARCH_TERMS = ETF_DATABASE.flatMap(etf => [
  etf.ticker.toLowerCase(),
  ...etf.keywords,
]);

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

  posts.forEach(post => {
    const searchText = `${post.title} ${post.tags || ''} ${post.summary || ''}`.toLowerCase();

    ETF_DATABASE.forEach(etfInfo => {
      // Check if any keyword matches
      const matches = [etfInfo.ticker.toLowerCase(), ...etfInfo.keywords].some(keyword =>
        searchText.includes(keyword)
      );

      if (matches) {
        const key = etfInfo.ticker;
        if (!etfData[key]) {
          etfData[key] = { posts: [], totalScore: 0, etfInfo };
        }
        // Avoid duplicate posts
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

// Get all ETFs for reference
export function getAllETFs(): ETFInfo[] {
  return ETF_DATABASE;
}
