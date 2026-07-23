"use client";

import { motion } from "framer-motion";
import { GRADE_OPTIONS, type Grade } from "@/lib/srs";

const GRADE_STYLES: Record<Grade, string> = {
  again: "border-[#e0aaaa] bg-[#fff2f0] text-[#a84040]",
  hard: "border-[#f0d78c] bg-[#fff6dd] text-[#9a6418]",
  good: "border-[#b7dccb] bg-[#eff9f4] text-[#238769]",
  easy: "border-[#8bc7ad] bg-[#e3f4ea] text-[#17694f]",
};

export default function GradeButtons({
  onGrade,
  disabled = false,
  pendingGrade = null,
}: {
  onGrade: (grade: Grade) => void;
  disabled?: boolean;
  pendingGrade?: Grade | null;
}) {
  return (
    <div className="mt-4">
      <p className="mb-2 text-center text-xs font-semibold text-[#777985]">Хэр сайн байна?</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {GRADE_OPTIONS.map(({ value, label }) => (
          <motion.button
            key={value}
            type="button"
            whileTap={disabled ? undefined : { scale: .97 }}
            disabled={disabled}
            onClick={() => onGrade(value)}
            className={`rounded-2xl border px-3 py-3.5 text-sm font-bold transition disabled:opacity-40 ${GRADE_STYLES[value]}`}
          >
            {pendingGrade === value ? "..." : label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
