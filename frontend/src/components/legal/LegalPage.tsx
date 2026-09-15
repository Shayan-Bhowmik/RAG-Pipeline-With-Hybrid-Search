import type { ReactNode } from "react";

import { LEGAL_DETAILS, LEGAL_LAST_UPDATED, type LegalDetailKey } from "@/lib/legal";

export interface LegalSection {
  id: string;
  heading: string;
  body: ReactNode;
}

interface LegalPageProps {
  title: string;
  intro: string;
  sections: LegalSection[];
}

/**
 * Renders a value from the legal config, or a clearly marked placeholder when
 * the real value has not been supplied yet.
 */
export function Detail({ name }: { name: LegalDetailKey }) {
  const detail = LEGAL_DETAILS[name];
  if (detail.value) return <span>{detail.value}</span>;

  return (
    <span className="rounded-sm border border-dashed border-border-strong px-1.5 py-0.5 font-mono text-[0.8em] text-fg-faint">
      [{detail.placeholder}]
    </span>
  );
}

export function LegalPage({ title, intro, sections }: LegalPageProps) {
  return (
    <main className="mx-auto w-full max-w-[1100px] px-5 py-14 sm:px-6 sm:py-20">
      <header className="max-w-3xl">
        <h1 className="text-[2rem] font-semibold tracking-tight text-fg sm:text-[2.25rem]">
          {title}
        </h1>
        <p className="mt-3 font-mono text-xs text-fg-faint">
          Last updated {LEGAL_LAST_UPDATED}
        </p>
        <p className="mt-5 text-[0.95rem] leading-7 text-fg-muted">{intro}</p>
      </header>

      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)] lg:gap-14">
        <nav aria-label="On this page" className="lg:sticky lg:top-20 lg:self-start">
          <h2 className="font-mono text-xs uppercase tracking-wider text-fg-faint">
            Contents
          </h2>
          <ol className="mt-3 space-y-1.5">
            {sections.map((section, index) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="flex gap-2 text-sm text-fg-muted transition-colors hover:text-fg"
                >
                  <span className="font-mono text-xs text-fg-faint">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{section.heading}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="min-w-0 max-w-3xl">
          {sections.map((section, index) => (
            <section
              key={section.id}
              id={section.id}
              aria-labelledby={`${section.id}-heading`}
              className="scroll-mt-20 border-t border-border py-8 first:border-t-0 first:pt-0"
            >
              <h2
                id={`${section.id}-heading`}
                className="flex gap-3 text-lg font-semibold tracking-tight text-fg"
              >
                <span className="font-mono text-sm text-fg-faint">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {section.heading}
              </h2>
              <div className="mt-3 space-y-3 text-[0.95rem] leading-7 text-fg-muted">
                {section.body}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
