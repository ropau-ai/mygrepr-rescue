import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Navigation } from "@/components/navigation";
import { MinimalFooter } from "@/components/minimal-footer";
import { AuthSessionProvider } from "@/components/session-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "Grepr — Intelligence financiere Reddit | ETF, Epargne, Strategie",
    template: "%s | Grepr",
  },
  description: "Intelligence financiere par IA extraite des communautes Reddit. ETFs, epargne, strategie d'investissement — analyses quotidiennes.",
  metadataBase: new URL("https://grepr.jelilahounou.com"),
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Grepr",
  },
  alternates: {
    canonical: "https://grepr.jelilahounou.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Grepr — Intelligence financiere Reddit",
    description: "Intelligence financiere par IA extraite des communautes Reddit.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning className="scroll-smooth">
      <head>
        <script defer src="https://umami.jelilahounou.com/script.js" data-website-id="1a717585-f7ae-4f62-80f1-b010d811d1fe"></script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Grepr",
              url: "https://grepr.jelilahounou.com",
              description: "Intelligence financiere par IA extraite des communautes Reddit.",
              inLanguage: "fr-FR",
            }),
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <AuthSessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange={false}
          >
            <Navigation />
            <div className="relative z-10 min-h-screen pb-12">
              {children}
            </div>
            <MinimalFooter />
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
