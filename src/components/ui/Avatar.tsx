import { cn } from "@/lib/utils";
import { initials } from "@/lib/permissions";

interface AvatarProps {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
  xl: "h-20 w-20 text-xl",
};

/** Ignore generated DiceBear defaults — show initials placeholder instead */
function isRealPhoto(src?: string) {
  if (!src) return false;
  if (src.includes("api.dicebear.com")) return false;
  return true;
}

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const photo = isRealPhoto(src);

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full border border-[var(--border)] bg-[var(--bg-soft)]",
        sizes[size],
        className
      )}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center font-medium text-secondary"
          aria-hidden
        >
          {initials(name)}
        </span>
      )}
    </div>
  );
}
