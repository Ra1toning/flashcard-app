export default function Meter({ label, value, sublabel }: { label: string; value: number; sublabel?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-xs font-semibold text-[#6b6255]">{label}</span>
        <span className="text-lg font-bold text-[#211f1a]">{clamped}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[#cde2fb]">
        <div className="h-full rounded-full bg-[#256abf] transition-all" style={{ width: `${clamped}%` }} />
      </div>
      {sublabel && <div className="mt-1 text-[11px] text-[#9a9184]">{sublabel}</div>}
    </div>
  );
}
