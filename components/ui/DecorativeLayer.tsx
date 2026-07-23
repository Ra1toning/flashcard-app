import { cn } from "@/lib/cn";

type Variant = "hero" | "review" | "deck" | "flashcard" | "auth" | "empty";

export default function DecorativeLayer({
  variant,
  className,
}: {
  variant: Variant;
  className?: string;
}) {
  const shapes: Record<Variant, string[]> = {
    hero: [
      "decorative-glow",
      "decorative-card decorative-card-one",
      "decorative-card decorative-card-two",
      "decorative-circle",
      "decorative-square",
      "decorative-dots",
      "decorative-line",
    ],
    review: [
      "decorative-glow",
      "decorative-card decorative-card-one",
      "decorative-card decorative-card-two",
      "decorative-circle",
      "decorative-dots",
    ],
    deck: [
      "decorative-glow",
      "decorative-card decorative-card-one",
      "decorative-card decorative-card-two",
      "decorative-dots",
    ],
    flashcard: [
      "decorative-glow",
      "decorative-dots",
      "decorative-line",
    ],
    auth: [
      "decorative-glow",
      "decorative-circle",
      "decorative-square",
      "decorative-dots",
    ],
    empty: [
      "decorative-glow",
      "decorative-circle",
      "decorative-square",
      "decorative-dots",
    ],
  };

  return (
    <span className={cn("decorative-layer", `decorative-${variant}`, className)} aria-hidden="true">
      {shapes[variant].map((shape) => <span key={shape} className={shape} />)}
    </span>
  );
}
