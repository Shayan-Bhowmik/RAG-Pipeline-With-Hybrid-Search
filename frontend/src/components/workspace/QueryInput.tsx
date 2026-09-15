"use client";

import { useId, useLayoutEffect, useRef } from "react";

import { MAX_QUERY_LENGTH } from "@/lib/config";
import { buttonPrimary, buttonSecondary, cn } from "@/lib/cn";

interface QueryInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  isSubmitting: boolean;
  /** Set when the last submit attempt was rejected before leaving the browser. */
  validationMessage: string | null;
  canClear: boolean;
}

const MAX_ROWS_HEIGHT = 220;

export function QueryInput({
  value,
  onChange,
  onSubmit,
  onClear,
  isSubmitting,
  validationMessage,
  canClear,
}: QueryInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();
  const hintId = useId();
  const errorId = useId();

  // Grow with the question, up to a ceiling, so long queries stay readable
  // without the control taking over the viewport.
  useLayoutEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, MAX_ROWS_HEIGHT)}px`;
  }, [value]);

  const overLimit = value.length > MAX_QUERY_LENGTH;
  const nearLimit = value.length > MAX_QUERY_LENGTH * 0.8;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="w-full"
    >
      <label htmlFor={inputId} className="sr-only">
        Ask a question about the indexed corpus
      </label>

      <div
        className={cn(
          "rounded-card border bg-surface transition-colors focus-within:border-accent",
          validationMessage ? "border-danger/60" : "border-border",
        )}
      >
        <textarea
          id={inputId}
          ref={textareaRef}
          value={value}
          rows={2}
          disabled={isSubmitting}
          spellCheck
          placeholder="Ask a question about the indexed corpus"
          aria-describedby={cn(hintId, validationMessage ? errorId : undefined)}
          aria-invalid={validationMessage ? true : undefined}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSubmit();
            }
          }}
          className="w-full resize-none bg-transparent px-4 py-3 text-base text-fg placeholder:text-fg-faint focus:outline-none disabled:opacity-60"
        />

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-3 py-2">
          <p id={hintId} className="font-mono text-xs text-fg-faint">
            Enter to run, Shift plus Enter for a new line
          </p>

          <div className="flex items-center gap-2">
            {nearLimit ? (
              <span
                className={cn(
                  "font-mono text-xs",
                  overLimit ? "text-danger" : "text-fg-muted",
                )}
              >
                {value.length} / {MAX_QUERY_LENGTH}
              </span>
            ) : null}

            <button
              type="button"
              onClick={onClear}
              disabled={!canClear || isSubmitting}
              className={cn(buttonSecondary, "px-3 py-1.5")}
            >
              Clear
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !value.trim() || overLimit}
              className={cn(buttonPrimary, "px-4 py-1.5")}
            >
              {isSubmitting ? "Running" : "Run query"}
            </button>
          </div>
        </div>
      </div>

      {validationMessage ? (
        <p id={errorId} role="alert" className="mt-2 text-sm text-danger">
          {validationMessage}
        </p>
      ) : null}
    </form>
  );
}
