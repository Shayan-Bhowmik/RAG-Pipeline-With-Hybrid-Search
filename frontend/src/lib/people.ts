/**
 * The people behind the project.
 *
 * Profile URLs are real. Where `portraitSrc` is null the Creators section
 * renders an initials frame marked "portrait pending" instead; add an image
 * under /public and reference it here to replace that. A null profile URL
 * simply omits that icon rather than linking nowhere.
 */

export interface Person {
  name: string;
  linkedInUrl: string | null;
  githubUrl: string | null;
  /** Two initials, used by the portrait frame until a real image is supplied. */
  initials: string;
  /** Path under /public, or null to fall back to the initials frame. */
  portraitSrc: string | null;
}

export const PEOPLE: Person[] = [
  {
    name: "Shayan Bhowmik",
    linkedInUrl: "https://www.linkedin.com/in/shayan-bhowmik-227808321/",
    githubUrl: "https://github.com/Shayan-Bhowmik",
    initials: "SB",
    portraitSrc: "/shayan-bhowmik.jpg",
  },
  {
    name: "Govind Nair",
    linkedInUrl: "https://www.linkedin.com/in/govind-nair-93495032a/",
    githubUrl: "https://github.com/govindhere06-code",
    initials: "GN",
    portraitSrc: "/govind-nair.jpg",
  },
];
