export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

/** Shared control styles, so buttons stay consistent without a UI library. */
export const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-card border text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40";

export const buttonPrimary = cn(
  buttonBase,
  "border-accent bg-accent px-4 py-2 text-white hover:enabled:bg-[#4d7ef0] hover:enabled:border-[#4d7ef0]",
);

export const buttonSecondary = cn(
  buttonBase,
  "border-border bg-transparent px-4 py-2 text-fg-muted hover:enabled:border-border-strong hover:enabled:text-fg",
);
