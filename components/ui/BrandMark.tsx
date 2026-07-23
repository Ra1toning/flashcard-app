import Image from "next/image";
import { cn } from "@/lib/cn";

export default function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("brand-mark", className)} aria-hidden="true">
      <Image
        src="/logo.png"
        alt=""
        width={600}
        height={600}
        className="brand-mark-image"
        priority
      />
    </span>
  );
}
