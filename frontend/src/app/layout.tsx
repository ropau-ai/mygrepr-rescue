import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Navigation } from "@/components/navigation";
import { AnimatedBackground } from "@/components/animated-background";
import { MinimalFooter } from "@/components/minimal-footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Grepr - Reddit Finance Dashboard",
  description: "Agrégateur de conseils financiers Reddit avec résumés AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning className="scroll-smooth">
      <head>
        <script defer src="https://unami.jelilahounou.com/script.js" data-website-id="1a717585-f7ae-4f62-80f1-b010d811d1fe"></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          <AnimatedBackground />
          <Navigation />
          <div className="relative z-10 min-h-screen pb-12">
            {children}
          </div>
          <MinimalFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
