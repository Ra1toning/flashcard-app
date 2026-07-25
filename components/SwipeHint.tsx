"use client";

import { motion, type MotionValue } from "framer-motion";

const HINT_STYLES = {
  right: { borderColor: "#b7dccb", background: "#eff9f4", color: "#238769", label: "Сайн" },
  left: { borderColor: "#e0aaaa", background: "#fff2f0", color: "#a84040", label: "Мартсан" },
} as const;

export default function SwipeHint({
  side,
  opacity,
  label,
}: {
  side: "left" | "right";
  opacity: MotionValue<number>;
  label?: string;
}) {
  const style = HINT_STYLES[side];
  return (
    <motion.div
      aria-hidden
      style={{ opacity, borderColor: style.borderColor, background: style.background, color: style.color }}
      className={`pointer-events-none absolute top-[165px] z-30 -translate-y-1/2 rounded-full border px-4 py-2 text-sm font-bold shadow-sm ${side === "right" ? "right-6" : "left-6"}`}
    >
      {label ?? style.label}
    </motion.div>
  );
}
