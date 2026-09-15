import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { AppShell } from "@/components/site/AppShell";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const DESCRIPTION =
  "HybridRAG answers questions from a private document corpus by running dense vector search and BM25 keyword search in parallel, fusing both ranked lists with reciprocal rank fusion, reranking with a cross-encoder, and citing every answer back to the chunks it came from.";

// Absolute URLs in Open Graph metadata need an origin. Set NEXT_PUBLIC_SITE_URL
// to the deployed domain; without it Next falls back to relative URLs.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: {
    default: "HybridRAG | Hybrid Retrieval for Grounded Answers",
    template: "%s | HybridRAG",
  },
  description: DESCRIPTION,
  applicationName: "HybridRAG",
  keywords: [
    "retrieval augmented generation",
    "hybrid search",
    "reciprocal rank fusion",
    "BM25",
    "pgvector",
    "cross-encoder reranking",
  ],
  openGraph: {
    type: "website",
    siteName: "HybridRAG",
    title: "HybridRAG | Hybrid Retrieval for Grounded Answers",
    description: DESCRIPTION,
    ...(siteUrl ? { url: siteUrl } : {}),
  },
  twitter: {
    card: "summary_large_image",
    title: "HybridRAG | Hybrid Retrieval for Grounded Answers",
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0e14",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <AppShell>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-card focus:border focus:border-accent focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:text-fg"
          >
            Skip to content
          </a>
          <SiteHeader />
          <div id="main" className="flex-1">
            {children}
          </div>
          <SiteFooter />
        </AppShell>
      </body>
    </html>
  );
}
