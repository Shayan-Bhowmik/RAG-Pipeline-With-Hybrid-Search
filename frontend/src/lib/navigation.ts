export interface NavItem {
  href: string;
  label: string;
  external?: boolean;
}

/** Primary navigation, shared by the header and the footer. */
export const PRIMARY_NAV: NavItem[] = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#architecture", label: "Architecture" },
  { href: "/#evaluation", label: "Evaluation" },
];

export const FOOTER_NAV: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/query", label: "Query" },
  { href: "/#architecture", label: "Architecture" },
  { href: "/#evaluation", label: "Evaluation" },
];

export const LEGAL_NAV: NavItem[] = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms and Conditions" },
];
