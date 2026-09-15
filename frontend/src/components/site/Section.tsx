import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface SectionProps {
  id?: string;
  eyebrow?: string;
  title: string;
  lead?: string;
  children: ReactNode;
  className?: string;
  /** Alternate surface, used to separate adjacent sections without a divider. */
  tone?: "base" | "sunken";
}

export function Section({
  id,
  eyebrow,
  title,
  lead,
  children,
  className,
  tone = "base",
}: SectionProps) {
  const headingId = id ? `${id}-heading` : undefined;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(
        "scroll-mt-16 border-t border-border py-16 sm:py-20",
        tone === "sunken" && "bg-surface-sunken",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-[1100px] px-5 sm:px-6">
        <header className="max-w-2xl">
          {eyebrow ? (
            <p className="font-mono text-xs uppercase tracking-wider text-accent">{eyebrow}</p>
          ) : null}
          <h2
            id={headingId}
            className="mt-3 text-2xl font-semibold tracking-tight text-fg sm:text-[1.75rem]"
          >
            {title}
          </h2>
          {lead ? <p className="mt-3 text-[0.95rem] leading-7 text-fg-muted">{lead}</p> : null}
        </header>

        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}
