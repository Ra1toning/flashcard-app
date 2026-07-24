"use client";

import { useRef, useState } from "react";

type Series = { key: string; label: string; color: string };
type Row = { x: string; [key: string]: number | string };

const WIDTH = 600;
const HEIGHT = 180;
const PAD_LEFT = 34;
const PAD_BOTTOM = 20;
const PAD_TOP = 10;

function niceCeiling(value: number): number {
  if (value <= 5) return 5;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return niceNormalized * magnitude;
}

export default function LineChart({
  data,
  series,
  formatX = (x: string) => x,
  formatValue = (v: number) => String(v),
}: {
  data: Row[];
  series: Series[];
  formatX?: (x: string) => string;
  formatValue?: (v: number) => string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const plotWidth = WIDTH - PAD_LEFT;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const maxValue = niceCeiling(Math.max(1, ...data.flatMap((row) => series.map((s) => Number(row[s.key]) || 0))));

  function xFor(i: number) {
    return data.length > 1 ? PAD_LEFT + (i / (data.length - 1)) * plotWidth : PAD_LEFT + plotWidth / 2;
  }
  function yFor(value: number) {
    return PAD_TOP + plotHeight - (value / maxValue) * plotHeight;
  }

  function handleMove(event: React.PointerEvent<SVGSVGElement>) {
    const svg = ref.current;
    if (!svg || data.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((event.clientX - rect.left) / rect.width) * WIDTH;
    const ratio = data.length > 1 ? (relX - PAD_LEFT) / plotWidth : 0;
    const index = Math.round(ratio * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, index)));
  }

  const ticks = [0, 0.5, 1].map((t) => Math.round(maxValue * t));
  const labelEvery = Math.max(1, Math.ceil(data.length / 6));

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
      <div className="relative">
        <svg
          ref={ref}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full"
          style={{ height: HEIGHT }}
          onPointerMove={handleMove}
          onPointerLeave={() => setHover(null)}
          role="img"
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD_LEFT} x2={WIDTH} y1={yFor(t)} y2={yFor(t)} stroke="#e6dfd3" strokeWidth={1} />
              <text x={PAD_LEFT - 6} y={yFor(t) + 3} textAnchor="end" fontSize={9} fill="#9a9184">{formatValue(t)}</text>
            </g>
          ))}
          <line x1={PAD_LEFT} x2={PAD_LEFT} y1={PAD_TOP} y2={HEIGHT - PAD_BOTTOM} stroke="#cbbda5" strokeWidth={1} />
          {data.map((row, i) => i % labelEvery === 0 && (
            <text key={i} x={xFor(i)} y={HEIGHT - 4} textAnchor="middle" fontSize={9} fill="#9a9184">{formatX(row.x as string)}</text>
          ))}
          {series.map((s) => {
            const points = data.map((row, i) => `${xFor(i)},${yFor(Number(row[s.key]) || 0)}`).join(" ");
            return <polyline key={s.key} points={points} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />;
          })}
          {hover !== null && data[hover] && (
            <g>
              <line x1={xFor(hover)} x2={xFor(hover)} y1={PAD_TOP} y2={HEIGHT - PAD_BOTTOM} stroke="#cbbda5" strokeWidth={1} strokeDasharray="2,2" />
              {series.map((s) => (
                <circle key={s.key} cx={xFor(hover)} cy={yFor(Number(data[hover][s.key]) || 0)} r={4} fill={s.color} stroke="#fffcf5" strokeWidth={2} />
              ))}
            </g>
          )}
        </svg>
        {hover !== null && data[hover] && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-[#e6e3da] bg-white px-2.5 py-1.5 text-xs shadow-lg"
            style={{ left: `${(xFor(hover) / WIDTH) * 100}%`, top: 0 }}
          >
            <div className="font-semibold text-[#211f1a]">{formatX(data[hover].x as string)}</div>
            {series.map((s) => (
              <div key={s.key} className="flex items-center gap-1.5 text-[#6b6255]">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
                {s.label}: <span className="font-semibold text-[#211f1a]">{formatValue(Number(data[hover][s.key]) || 0)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
