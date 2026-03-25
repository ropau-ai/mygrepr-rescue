import type { Metadata } from "next";
import { Inter, Playfair_Display, Libre_Baskerville, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import { Navigation } from "@/components/navigation";
import { MinimalFooter } from "@/components/minimal-footer";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const baskerville = Libre_Baskerville({
  variable: "--font-body-serif",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Grepr - Reddit Finance Intelligence",
  description: "AI-powered financial insights from Reddit communities",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="fr" suppressHydrationWarning className="scroll-smooth">
        <body
          className={`${inter.variable} ${playfair.variable} ${baskerville.variable} ${jetbrainsMono.variable} antialiased`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange={false}
          >
            <Navigation />
            <div className="relative z-10 min-h-screen pb-12">
              {children}
            </div>
            <MinimalFooter />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
