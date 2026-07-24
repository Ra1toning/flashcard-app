export default function StatTile({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? "border-[#f0d78c] bg-[#fff6dd]" : "border-[#e6e3da] bg-[#fffdf8]"}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-[#9a9184]">{label}</div>
      <div className="mt-1.5 text-2xl font-bold text-[#211f1a]">{value}</div>
      {sub && <div className="mt-1 text-xs text-[#6b6255]">{sub}</div>}
    </div>
  );
}
