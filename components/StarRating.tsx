"use client";

import { useState } from "react";
import { Star } from "lucide-react";

export default function StarRating({
  value,
  onRate,
  readOnly = false,
  size = 22,
  disabled = false,
}: {
  value: number;
  onRate?: (value: number) => void;
  readOnly?: boolean;
  size?: number;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const display = hover || value;

  return (
    <div className="inline-flex items-center gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(display);
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly || disabled}
            onMouseEnter={() => !readOnly && !disabled && setHover(star)}
            onClick={() => !readOnly && !disabled && onRate?.(star)}
            className={readOnly || disabled ? "cursor-default" : "cursor-pointer transition hover:scale-110"}
            aria-label={`${star} од өгөх`}
          >
            <Star
              style={{ width: size, height: size }}
              strokeWidth={1.8}
              className={filled ? "fill-[#e6a52c] text-[#e6a52c]" : "fill-transparent text-[#cfd2da]"}
            />
          </button>
        );
      })}
    </div>
  );
}
