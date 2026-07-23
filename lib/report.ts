export const REPORT_REASONS = [
  { value: "wrong", label: "Буруу орчуулга эсвэл утга" },
  { value: "spam", label: "Спам эсвэл сурталчилгаа" },
  { value: "offensive", label: "Доромжилсон эсвэл зохисгүй агуулга" },
  { value: "broken", label: "Эвдэрсэн, танихгүй тэмдэгт" },
  { value: "other", label: "Бусад" },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]["value"];

export const REPORT_REASON_VALUES: readonly string[] = REPORT_REASONS.map((reason) => reason.value);

export function reportReasonLabel(value: string): string {
  return REPORT_REASONS.find((reason) => reason.value === value)?.label ?? value;
}
