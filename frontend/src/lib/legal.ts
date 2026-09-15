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
  contactEmail: { value: null, placeholder: "contact email to be added" },
  operator: { value: null, placeholder: "operating individual or entity to be named" },
  jurisdiction: { value: null, placeholder: "governing jurisdiction to be confirmed" },
  retentionPeriod: { value: null, placeholder: "server log retention period to be confirmed" },
} satisfies Record<string, LegalValue>;

export type LegalDetailKey = keyof typeof LEGAL_DETAILS;
