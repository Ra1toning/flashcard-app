"use client";

import { useState } from "react";
import { CHART_INK } from "@/components/admin/chart-tokens";

type Series = { key: string; label: string; color: string };
type Row = { x: string; [key: string]: number | string };

function niceCeiling(value: number): number {
  if (value <= 5) return 5;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return niceNormalized * magnitude;
}

export default function BarChart({
  data,
  series,
  height = 160,
  formatX = (x: string) => x,
  formatValue = (v: number) => String(v),
}: {
  data: Row[];
  series: Series[];
  height?: number;
  formatX?: (x: string) => string;
  formatValue?: (v: number) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const totals = data.map((row) => series.reduce((sum, s) => sum + (Number(row[s.key]) || 0), 0));
  const maxValue = niceCeiling(Math.max(1, ...totals));
  const ticks = [0, 0.5, 1].map((t) => Math.round(maxValue * t));
  const labelEvery = Math.max(1, Math.ceil(data.length / 6));
  const reversedSeries = [...series].reverse();

  return (
    <div>
      {series.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-3 text-xs text-[#6b6255]">
          {series.map((s) => (
            <span key={s.key} className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.label}
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <div className="flex flex-col justify-between text-right text-[10px] text-[#9a9184]" style={{ height }}>
          {[...ticks].reverse().map((t) => <span key={t}>{formatValue(t)}</span>)}
        </div>
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between" style={{ height }}>
            {ticks.map((t) => <div key={t} className="border-t border-[#e6dfd3]" />)}
          </div>
          <div className="relative flex items-end gap-[2px]" style={{ height }}>
            {data.map((row, i) => (
              <div
                key={i}
                className="relative flex flex-1 flex-col items-stretch justify-end outline-none"
                style={{ height }}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                tabIndex={0}
              >
                <div className="flex flex-col justify-end overflow-hidden rounded-t-[4px]">
                  {reversedSeries.map((s, si) => {
                    const value = Number(row[s.key]) || 0;
                    const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
                    return (
                      <div
                        key={s.key}
                        style={{
                          height: `${pct}%`,
                          background: s.color,
                          opacity: hover === null || hover === i ? 1 : 0.35,
                          borderBottom: si < reversedSeries.length - 1 ? `2px solid ${CHART_INK.surface}` : undefined,
                        }}
                        className="w-full transition-opacity"
                      />
                    );
                  })}
                </div>
                {hover === i && (
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max -translate-x-1/2 rounded-lg border border-[#e6e3da] bg-white px-2.5 py-1.5 text-xs shadow-lg">
                    <div className="font-semibold text-[#211f1a]">{formatX(row.x as string)}</div>
                    {series.map((s) => (
                      <div key={s.key} className="flex items-center gap-1.5 text-[#6b6255]">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
                        {s.label}: <span className="font-semibold text-[#211f1a]">{formatValue(Number(row[s.key]) || 0)}</span>
                      </div>
                    ))}
                    {series.length > 1 && (
                      <div className="mt-0.5 border-t border-[#eee9dc] pt-0.5 font-semibold text-[#211f1a]">Нийт: {formatValue(totals[i])}</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-1 flex gap-[2px] text-[10px] text-[#9a9184]">
            {data.map((row, i) => (
              <div key={i} className="flex-1 text-center">{i % labelEvery === 0 ? formatX(row.x as string) : ""}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
