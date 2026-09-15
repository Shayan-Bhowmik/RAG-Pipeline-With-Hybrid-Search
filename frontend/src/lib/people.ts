/**
 * The people behind the project.
 *
 * `linkedInUrl` holds the real profile URLs. Where `portraitSrc` is null the
 * Made by section renders an initials frame marked "portrait pending" instead;
 * add an image under /public and reference it here to replace that.
 */

export interface Person {
  name: string;
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
    linkedInUrl: "https://www.linkedin.com/in/shayan-bhowmik-227808321/",
    initials: "SB",
    portraitSrc: "/shayan-bhowmik.jpg",
  },
  {
    name: "Govind Nair",
    linkedInUrl: "https://www.linkedin.com/in/govind-nair-93495032a/",
    initials: "GN",
    portraitSrc: "/govind-nair.jpg",
  },
];
