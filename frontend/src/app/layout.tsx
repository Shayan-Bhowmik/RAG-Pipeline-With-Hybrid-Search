import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Sora } from "next/font/google";
import localFont from "next/font/local";

import { AppShell } from "@/components/site/AppShell";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

import "./globals.css";

/**
 * Sentient is the display face, used only on the homepage hero heading.
 *
 * It is not on Google Fonts, so the variable woff2 is vendored under
 * public/fonts/sentient/ and loaded through next/font/local. That gets the
 * same treatment as the Google fonts below: a generated @font-face, a hashed
 * self-hosted URL, and an automatic preload, which a hand-written @font-face
 * would not produce.
 *
 * The variable file covers weight 200 to 700 in roughly 49 KB. The hero renders
 * at 600, which Sentient ships no static file for, so the variable font is the
 * only way to hit the weight the design actually uses.
 */
const sentient = localFont({
  src: "../../public/fonts/sentient/Sentient-Variable.woff2",
  weight: "200 700",
  style: "normal",
  variable: "--font-sentient-local",
  display: "swap",
  // Sentient is a serif. Falling back to a sans during the swap would shift
  // the hero noticeably, so the fallback stays in the same genre.
  fallback: ["ui-serif", "Georgia", "serif"],
});

/**
 * Sora is the primary face: body copy, every heading below the hero, buttons,
 * navigation and UI text, inherited through the `sans` theme token rather than
 * a utility class on each component.
 *
 * Only 400, 500 and 600 are requested because that is the complete set the
 * codebase uses. There is no `font-bold` anywhere in src/, so shipping 700
 * would be dead weight.
 */
const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

/**
 * JetBrains Mono is reserved for technical metadata: chunk IDs, endpoint paths,
 * scores, model names and parameter values. No `weight` is passed, so Next
 * serves the variable file and the full range stays available.
 */
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
    <html
      lang="en"
      className={`${sora.variable} ${sentient.variable} ${jetbrainsMono.variable}`}
    >
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
