import Link from "next/link";

import { SITE } from "@/lib/config";
import { FOOTER_NAV, LEGAL_NAV } from "@/lib/navigation";

import { Wordmark } from "./Wordmark";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface-sunken">
      <div className="mx-auto w-full max-w-[1100px] px-5 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="min-w-0">
            <Wordmark />
            <p className="mt-3 max-w-sm text-sm text-fg-muted">
              A retrieval-augmented generation system that combines dense vector search
              with BM25 keyword search, fuses both ranked lists with reciprocal rank
              fusion, reranks with a cross-encoder, and cites every answer back to the
              chunks it was generated from.
            </p>
          </div>

          <nav aria-label="Footer">
            <h2 className="font-mono text-xs uppercase tracking-wider text-fg-faint">
              Navigate
            </h2>
            <ul className="mt-3 space-y-2">
              {FOOTER_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-fg-muted transition-colors hover:text-fg"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href={SITE.repoUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-sm text-fg-muted transition-colors hover:text-fg"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </nav>

          <nav aria-label="Legal">
            <h2 className="font-mono text-xs uppercase tracking-wider text-fg-faint">
              Legal
            </h2>
            <ul className="mt-3 space-y-2">
              {LEGAL_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-fg-muted transition-colors hover:text-fg"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <p className="mt-10 border-t border-border pt-6 font-mono text-xs text-fg-faint">
          Copyright {new Date().getFullYear()} HybridRAG. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
