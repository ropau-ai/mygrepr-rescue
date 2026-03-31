import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Grepr — Intelligence financiere Reddit';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: '#ffffff',
            marginBottom: 16,
            letterSpacing: '-0.02em',
          }}
        >
          Grepr
        </div>
        <div
          style={{
            fontSize: 28,
            color: '#94a3b8',
            maxWidth: 700,
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          Intelligence financiere par IA extraite des communautes Reddit
        </div>
        <div
          style={{
            display: 'flex',
            gap: 16,
            marginTop: 40,
          }}
        >
          {['ETF', 'Epargne', 'Immobilier', 'Strategie'].map((tag) => (
            <div
              key={tag}
              style={{
                padding: '8px 20px',
                borderRadius: 20,
                background: 'rgba(99, 102, 241, 0.2)',
                color: '#a5b4fc',
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
