"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
}

/**
 * Entrance transition for content that appears in response to an action,
 * such as a query result arriving.
 *
 * It animates on mount rather than on scroll, so it is only ever applied to
 * elements that did not exist a moment ago. Scroll-triggered reveals are
 * deliberately not used: they would leave server-rendered page content at
 * zero opacity for anyone whose JavaScript does not run.
 *
 * MotionConfig in the root layout sets reducedMotion="user", so the movement
 * collapses to a plain fade when the visitor asks for reduced motion.
 */
export function Reveal({ children, className }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
