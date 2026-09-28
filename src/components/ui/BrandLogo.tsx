"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** CENG wordmark — 1024×411, keep natural aspect ratio (never square-crop). */
export function BrandLogo({
  href = "/dashboard",
  className,
  height = 28,
  showWord = false,
}: {
  href?: string | null;
  className?: string;
  height?: number;
  showWord?: boolean;
}) {
  const width = Math.round((height * 1024) / 411);
  const mark = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src="/ceng-logo.jpg"
        alt="CENG"
        width={1024}
        height={411}
        priority
        quality={95}
        sizes={`${width}px`}
        className="rounded-sm"
        style={{ height, width: "auto", maxWidth: width }}
      />
      {showWord && (
        <span className="text-sm font-medium tracking-tight">CENG</span>
      )}
    </span>
  );

  if (!href) return mark;
  return (
    <Link href={href} className="inline-flex items-center">
      {mark}
    </Link>
  );
}
