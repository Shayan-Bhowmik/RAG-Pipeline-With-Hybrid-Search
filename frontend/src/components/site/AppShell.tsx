"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

import { BootScreen } from "./BootScreen";

/**
 * Wraps the app in one motion configuration. reducedMotion="user" means every
 * Motion transition in the tree honours the visitor's system preference
 * without each component checking for itself.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <BootScreen />
      {children}
    </MotionConfig>
  );
}
