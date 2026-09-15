/**
 * Project-specific details the legal pages need.
 *
 * PLACEHOLDER values are marked as such and are rendered with a visible
 * "to be confirmed" treatment, so nothing on the published pages claims a
 * contact address, legal entity or jurisdiction that does not exist yet.
 * Replace a value with a real string and the marker disappears.
 */

export interface LegalValue {
  value: string | null;
  /** Shown in place of a missing value. */
  placeholder: string;
}

export const LEGAL_LAST_UPDATED = "15 September 2026";

export const LEGAL_DETAILS = {
  operator: {
    value: "Shayan Bhowmik and Govind Nair",
    placeholder: "operating individual or entity to be named",
  },
} satisfies Record<string, LegalValue>;

/** Addresses the legal pages route enquiries to, rendered as mailto links. */
export const CONTACT_EMAILS: ReadonlyArray<{ name: string; email: string }> = [
  { name: "Shayan Bhowmik", email: "shayan.bhowmik05@gmail.com" },
  { name: "Govind Nair", email: "govindhere.06@gmail.com" },
];

export type LegalDetailKey = keyof typeof LEGAL_DETAILS;
