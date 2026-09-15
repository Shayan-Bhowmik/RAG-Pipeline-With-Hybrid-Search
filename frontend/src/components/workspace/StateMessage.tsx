import { buttonSecondary, cn } from "@/lib/cn";

export type StateTone = "error" | "neutral";

interface StateMessageProps {
  tone: StateTone;
  title: string;
  description: string;
  actionLabel?: string | null;
  onAction?: () => void;
  /** Optional secondary line, for example a configuration hint. */
  hint?: string;
}

/**
 * The single presentation for every failure and empty state in the workspace.
 * Each one names what happened and what to do next; none of them render raw
 * backend output.
 */
export function StateMessage({
  tone,
  title,
  description,
  actionLabel,
  onAction,
  hint,
}: StateMessageProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-card border bg-surface p-6",
        tone === "error" ? "border-danger/40" : "border-border",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "mt-2 h-1.5 w-1.5 shrink-0 rounded-full",
            tone === "error" ? "bg-danger" : "bg-fg-faint",
          )}
        />
        <div className="min-w-0">
          <h3 className="text-base font-semibold tracking-tight text-fg">
            {tone === "error" && <span className="sr-only">Error: </span>}
            {title}
          </h3>
          <p className="mt-2 text-sm text-fg-muted">{description}</p>
          {hint ? (
            <p className="mt-2 font-mono text-xs text-fg-faint">{hint}</p>
          ) : null}
          {actionLabel && onAction ? (
            <button type="button" onClick={onAction} className={cn(buttonSecondary, "mt-4")}>
              {actionLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
