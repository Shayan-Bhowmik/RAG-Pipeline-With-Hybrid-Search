"use client";

import { animate, createTimeline } from "animejs";
import { useEffect, useRef, useState } from "react";

import { prefersReducedMotion } from "@/lib/motion";

import { Wordmark } from "./Wordmark";

/**
 * Initialisation screen shown once per browsing session.
 *
 * The loader is indeterminate on purpose: nothing here is bound to a real
 * measurable process, so showing a percentage would be inventing one. It
 * resolves in well under two seconds.
 *
 * The overlay is part of the server-rendered HTML so it is painted with the
 * first frame rather than appearing after hydration. Visitors who have already
 * seen it this session, or who ask for reduced motion, have it removed on the
 * first client frame instead. Page content sits underneath it in the document
 * either way, so nothing is hidden from a crawler.
 */

const SESSION_KEY = "hybridrag-boot-shown";

const LINES = [
  "Initializing retrieval engine",
  "Loading index",
  "Preparing search pipeline",
];

function alreadyShownThisSession(): boolean {
  try {
    return window.sessionStorage.getItem(SESSION_KEY) !== null;
  } catch {
    // Private browsing or blocked storage. Showing it again is harmless.
    return false;
  }
}

export function BootScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<Array<HTMLLIElement | null>>([]);
  const barRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // A timer rather than an animation frame: frames are paused in a
    // background tab, and the overlay must come down regardless.
    if (prefersReducedMotion() || alreadyShownThisSession()) {
      const immediate = window.setTimeout(() => setIsVisible(false), 0);
      return () => window.clearTimeout(immediate);
    }

    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // Storage unavailable. The screen simply shows again next time.
    }

    const lines = lineRefs.current.filter((line): line is HTMLLIElement => line !== null);

    // Indeterminate sweep, looping until the sequence finishes.
    const sweep = barRef.current
      ? animate(barRef.current, {
          translateX: ["-100%", "220%"],
          duration: 900,
          ease: "inOutQuad",
          loop: true,
        })
      : null;

    const dismiss = () => {
      sweep?.pause();
      setIsVisible(false);
    };

    // Animation frames are paused while the tab is in the background, so the
    // timeline alone could leave the overlay up on a tab opened behind another.
    // This timer is not affected and guarantees the page is reachable.
    const safety = window.setTimeout(dismiss, 2600);

    const timeline = createTimeline({ onComplete: dismiss });

    lines.forEach((line, index) => {
      timeline.add(
        line,
        { opacity: [0, 1], translateY: [6, 0], duration: 260, ease: "out(2)" },
        index * 260,
      );
    });

    if (overlayRef.current) {
      timeline.add(
        overlayRef.current,
        { opacity: [1, 0], duration: 320, ease: "inQuad" },
        LINES.length * 260 + 200,
      );
    }

    return () => {
      window.clearTimeout(safety);
      sweep?.pause();
      timeline.pause();
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      ref={overlayRef}
      role="status"
      aria-label="Loading HybridRAG"
      className="boot-overlay fixed inset-0 z-50 flex items-center justify-center bg-bg"
    >
      <div className="w-full max-w-sm px-6">
        <Wordmark />

        <span className="mt-5 block h-px w-full overflow-hidden bg-border">
          <span ref={barRef} className="block h-px w-1/3 bg-accent" />
        </span>

        <ul className="mt-5 space-y-1.5">
          {LINES.map((line, index) => (
            <li
              key={line}
              ref={(element) => {
                lineRefs.current[index] = element;
              }}
              style={{ opacity: 0 }}
              className="font-mono text-xs text-fg-muted"
            >
              {line}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default BootScreen;
