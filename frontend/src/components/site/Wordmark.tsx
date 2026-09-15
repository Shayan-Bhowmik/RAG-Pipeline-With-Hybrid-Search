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

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Mark className="h-5 w-5 text-accent" />
      <span className="text-[0.95rem] font-semibold tracking-tight text-fg">
        HybridRAG
      </span>
    </span>
  );
}
