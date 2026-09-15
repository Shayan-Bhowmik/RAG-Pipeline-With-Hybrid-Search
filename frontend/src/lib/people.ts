/**
 * The people behind the project.
 *
 * PLACEHOLDER: `linkedInUrl` is null for both entries because no real profile
 * URL exists anywhere in the repository. Replace each null with the real
 * profile URL and the Made by section will render a working link instead of a
 * disabled one. Nothing else needs to change.
 */

export interface Person {
  name: string;
  role: string;
  /** Null renders as a clearly marked pending link, never as a fake profile. */
  linkedInUrl: string | null;
  /** Two initials, used by the portrait frame until a real image is supplied. */
  initials: string;
  /** PLACEHOLDER: path under /public once a real portrait is added. */
  portraitSrc: string | null;
}

export const PEOPLE: Person[] = [
  {
    name: "Shayan Bhowmik",
    role: "Retrieval pipeline and evaluation",
    linkedInUrl: null,
    initials: "SB",
    portraitSrc: null,
  },
  {
    name: "Govind Nair",
    role: "Backend and frontend engineering",
    linkedInUrl: null,
    initials: "GN",
    portraitSrc: null,
  },
];
