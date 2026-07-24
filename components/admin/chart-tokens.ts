export const CATEGORICAL = [
  { slot: 1, hue: "blue", hex: "#2a78d6" },
  { slot: 2, hue: "orange", hex: "#eb6834" },
  { slot: 3, hue: "aqua", hex: "#1baf7a" },
  { slot: 4, hue: "yellow", hex: "#eda100" },
  { slot: 5, hue: "magenta", hex: "#e87ba4" },
  { slot: 6, hue: "green", hex: "#008300" },
  { slot: 7, hue: "violet", hex: "#4a3aa7" },
  { slot: 8, hue: "red", hex: "#e34948" },
] as const;

export const STATUS = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
} as const;

export const SEQUENTIAL_BLUE = {
  100: "#cde2fb",
  250: "#86b6ef",
  400: "#3987e5",
  500: "#256abf",
  600: "#184f95",
} as const;

export const CHART_INK = {
  surface: "#fffcf5",
  primary: "#211f1a",
  secondary: "#6b6255",
  muted: "#9a9184",
  gridline: "#e6dfd3",
  baseline: "#cbbda5",
} as const;
