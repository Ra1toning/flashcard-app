export default function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let cursor = 0;
  const stops = data.map((d) => {
    const start = total > 0 ? (cursor / total) * 360 : 0;
    cursor += d.value;
    const end = total > 0 ? (cursor / total) * 360 : 0;
    return `${d.color} ${start}deg ${end}deg`;
  });
  const gradient = total > 0 ? `conic-gradient(${stops.join(", ")})` : "conic-gradient(#e6dfd3 0deg 360deg)";

  return (
    <div className="flex items-center gap-5">
      <div className="relative h-28 w-28 shrink-0 rounded-full" style={{ background: gradient }}>
        <div className="absolute inset-[18%] grid place-items-center rounded-full bg-[#fffdf8] text-center">
          <div>
            <div className="text-lg font-bold text-[#211f1a]">{total}</div>
            <div className="text-[9px] text-[#9a9184]">нийт</div>
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-1.5 text-xs">
        {data.map((d) => (
          <div key={d.label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-[#6b6255]">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: d.color }} />
              {d.label}
            </span>
            <span className="font-semibold text-[#211f1a]">
              {d.value} <span className="font-normal text-[#9a9184]">({total > 0 ? Math.round((d.value / total) * 100) : 0}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
