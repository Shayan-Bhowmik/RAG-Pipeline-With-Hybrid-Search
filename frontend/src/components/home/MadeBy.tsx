import Image from "next/image";

import { cn } from "@/lib/cn";
import { PEOPLE, type Person } from "@/lib/people";

/** The LinkedIn brand mark, drawn inline so it inherits the link's colour. */
function LinkedInIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className="h-[18px] w-[18px]"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

/** The GitHub brand mark, drawn inline so it inherits the link's colour. */
function GitHubIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className="h-[18px] w-[18px]"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

/**
 * Icon-only profile link. The icon carries no text, so the accessible name is
 * supplied separately rather than left to the SVG.
 */
function ProfileLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-card border border-border",
        "text-fg-muted transition-colors hover:border-border-strong hover:text-fg",
      )}
    >
      {children}
      <span className="sr-only">{label}</span>
    </a>
  );
}

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
          Creators
        </h2>

        <ul className="mx-auto mt-10 grid max-w-2xl gap-10 sm:grid-cols-2">
          {PEOPLE.map((person) => (
            <li key={person.name} className="text-center">
              <PortraitFrame person={person} />

              <h3 className="mt-4 text-base font-semibold tracking-tight text-fg">
                {person.name}
              </h3>

              <div className="mt-3 flex items-center justify-center gap-2">
                {person.linkedInUrl ? (
                  <ProfileLink
                    href={person.linkedInUrl}
                    label={`${person.name} on LinkedIn`}
                  >
                    <LinkedInIcon />
                  </ProfileLink>
                ) : null}
                {person.githubUrl ? (
                  <ProfileLink
                    href={person.githubUrl}
                    label={`${person.name} on GitHub`}
                  >
                    <GitHubIcon />
                  </ProfileLink>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
