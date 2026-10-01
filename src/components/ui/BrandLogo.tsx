"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Intrinsic size of padded logo assets in /public */
const LOGO_W = 1024;
const LOGO_H = 410;

/**
 * CENG wordmark — theme-aware (black mark in light, blue mark in dark).
 * Padded assets + object-contain so the silhouette isn’t cropped.
 */
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
  const width = Math.round((height * LOGO_W) / LOGO_H);
  const mark = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className="relative inline-block overflow-visible"
        style={{ height, width }}
      >
        {/* Light mode: black mark on transparent */}
        <Image
          src="/ceng-logo-light.png"
          alt="CENG"
          width={LOGO_W}
          height={LOGO_H}
          priority
          quality={95}
          sizes={`${width}px`}
          className="hidden h-full w-full object-contain object-left [[data-theme=light]_&]:block"
        />
        {/* Dark mode: blue mark on transparent */}
        <Image
          src="/ceng-logo-dark.png"
          alt="CENG"
          width={LOGO_W}
          height={LOGO_H}
          priority
          quality={95}
          sizes={`${width}px`}
          className="block h-full w-full object-contain object-left [[data-theme=light]_&]:hidden"
        />
      </span>
      {showWord && (
        <span className="text-sm font-medium tracking-tight">CENG</span>
      )}
    </span>
  );

  if (!href) return mark;
  return (
    <Link href={href} className="inline-flex shrink-0 items-center overflow-visible">
      {mark}
    </Link>
  );
}
