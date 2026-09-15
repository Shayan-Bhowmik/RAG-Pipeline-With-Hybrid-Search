"use client";

import Link from "next/link";
import { useState } from "react";

import { buttonPrimary, cn } from "@/lib/cn";
import { SITE } from "@/lib/config";
import { PRIMARY_NAV } from "@/lib/navigation";

import { Wordmark } from "./Wordmark";

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full max-w-[1100px] items-center justify-between gap-4 px-5 sm:px-6">
        <Link href="/" className="shrink-0" aria-label="HybridRAG home">
          <Wordmark />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-fg-muted transition-colors hover:text-fg"
            >
              {item.label}
            </Link>
          ))}
          <a
            href={SITE.repoUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="text-sm text-fg-muted transition-colors hover:text-fg"
          >
            GitHub
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/query" className={cn(buttonPrimary, "px-3 py-1.5 text-xs sm:text-sm")}>
            Open workspace
          </Link>

          <button
            type="button"
            aria-expanded={isMenuOpen}
            aria-controls="site-menu"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="rounded-card border border-border px-3 py-1.5 font-mono text-xs text-fg-muted transition-colors hover:text-fg md:hidden"
          >
            {isMenuOpen ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      <div
        id="site-menu"
        className={cn("border-t border-border md:hidden", isMenuOpen ? "block" : "hidden")}
      >
        <nav aria-label="Primary, mobile" className="mx-auto w-full max-w-[1100px] px-5 py-3 sm:px-6">
          <ul className="space-y-1">
            {PRIMARY_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded-card px-2 py-2 text-sm text-fg-muted transition-colors hover:bg-surface hover:text-fg"
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
                className="block rounded-card px-2 py-2 text-sm text-fg-muted transition-colors hover:bg-surface hover:text-fg"
              >
                GitHub
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
