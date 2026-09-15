"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/** Read once, outside React, for imperative animation code. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(QUERY).matches;
}

function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/** Server render assumes motion is allowed, then hydration corrects it. */
function getServerSnapshot(): boolean {
  return false;
}

/**
 * Tracks the reduced-motion preference, including changes made mid-session.
 * The media query is an external store, so it is read through
 * useSyncExternalStore rather than mirrored into state from an effect.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, getServerSnapshot);
}

/**
 * Subscriptions are cached per query so useSyncExternalStore receives stable
 * function identities across renders.
 */
const mediaCache = new Map<
  string,
  { subscribe: (onChange: () => void) => () => void; getSnapshot: () => boolean }
>();

function mediaStore(query: string) {
  const cached = mediaCache.get(query);
  if (cached) return cached;

  const store = {
    subscribe(onChange: () => void) {
      if (typeof window === "undefined" || !window.matchMedia) return () => {};
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    getSnapshot() {
      if (typeof window === "undefined" || !window.matchMedia) return false;
      return window.matchMedia(query).matches;
    },
  };

  mediaCache.set(query, store);
  return store;
}

/** Server render assumes the query does not match, then hydration corrects it. */
export function useMediaQuery(query: string): boolean {
  const store = mediaStore(query);
  return useSyncExternalStore(store.subscribe, store.getSnapshot, getServerSnapshot);
}
