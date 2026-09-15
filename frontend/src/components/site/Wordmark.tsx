import { cn } from "@/lib/cn";

/**
 * The HybridRAG mark: two retrieval paths, dense and sparse, converging into a
 * single fused node. The same geometry is used for the favicon.
 */
export function Mark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("h-5 w-5", className)}
    >
      <path
        d="M4 7 C 13 7, 13 16, 21 16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M4 25 C 13 25, 13 16, 21 16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle cx="24" cy="16" r="4" fill="currentColor" />
    </svg>
  );
}

/**
 * The wordmark is set in Sentient, the same display face as the homepage hero.
 * Those two are the only places the brand speaks in its own voice; everything
 * else stays in Sora. It is already preloaded for the hero, so reusing it here
 * costs no extra bytes.
 *
 * The mark is nudged up by 0.09em. `items-center` centres it on the text's
 * line box, but the descender in "Hybrid" drags that box down, so the mark
 * lands about 1.35px below the cap band at this size and reads as sagging.
 * The eye aligns a mark to the cap band rather than to a single descender, and
 * an em offset keeps that true if the wordmark is ever resized.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Mark className="h-5 w-5 -translate-y-[0.09em] text-accent" />
      <span className="font-sentient text-[1.02rem] font-semibold text-fg">
        HybridRAG
      </span>
    </span>
  );
}
