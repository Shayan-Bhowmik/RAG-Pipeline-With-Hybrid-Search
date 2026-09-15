import Image from "next/image";

import { cn } from "@/lib/cn";
import { PEOPLE, type Person } from "@/lib/people";

function PortraitFrame({ person }: { person: Person }) {
  return (
    <div className="mx-auto w-full max-w-[168px] overflow-hidden rounded-card border border-border bg-surface-sunken">
      <div className="relative aspect-[4/5]">
        {person.portraitSrc ? (
          <Image
            src={person.portraitSrc}
            alt={`Portrait of ${person.name}`}
            fill
            sizes="168px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2">
            <span
              aria-hidden="true"
              className="font-mono text-2xl tracking-widest text-fg-faint"
            >
              {person.initials}
            </span>
            <span className="font-mono text-[0.6rem] uppercase tracking-wider text-fg-faint">
              portrait pending
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function MadeBy() {
  return (
    <section
      id="made-by"
      aria-labelledby="made-by-heading"
      className="border-t border-border py-16 sm:py-20"
    >
      <div className="mx-auto w-full max-w-[1100px] px-5 sm:px-6">
        <h2
          id="made-by-heading"
          className="text-center text-2xl font-semibold tracking-tight text-fg sm:text-[1.75rem]"
        >
          Made by
        </h2>

        <ul className="mx-auto mt-10 grid max-w-2xl gap-10 sm:grid-cols-2">
          {PEOPLE.map((person) => (
            <li key={person.name} className="text-center">
              <PortraitFrame person={person} />

              <h3 className="mt-4 text-base font-semibold tracking-tight text-fg">
                {person.name}
              </h3>
              <p className="mt-1 text-sm text-fg-muted">{person.role}</p>

              {person.linkedInUrl ? (
                <a
                  href={person.linkedInUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={cn(
                    "mt-3 inline-flex items-center gap-1.5 rounded-card border border-border px-3 py-1.5",
                    "font-mono text-xs text-fg-muted transition-colors hover:border-border-strong hover:text-fg",
                  )}
                >
                  LinkedIn
                </a>
              ) : (
                <span
                  className="mt-3 inline-flex items-center gap-1.5 rounded-card border border-dashed border-border px-3 py-1.5 font-mono text-xs text-fg-faint"
                  title="Replace linkedInUrl in src/lib/people.ts with the real profile URL"
                >
                  LinkedIn link pending
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
