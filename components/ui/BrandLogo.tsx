import BrandMark from "@/components/ui/BrandMark";
import { cn } from "@/lib/cn";

export default function BrandLogo({
  className,
  markClassName = "h-9 w-9",
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cn("brand-logo", className)}>
      <BrandMark className={markClassName} />
      <span className="brand-wordmark">
        Nudl<span className="brand-wordmark-eye">eye</span>
      </span>
    </span>
  );
}
