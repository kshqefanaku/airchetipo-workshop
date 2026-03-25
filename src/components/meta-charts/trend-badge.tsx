"use client";

import { cn } from "@/lib/utils";

type Trend = "up" | "down" | "stable";

interface TrendBadgeProps {
  delta: number;
  trend: Trend;
  className?: string;
}

export const trendConfig = {
  up: {
    label: "Rising",
    arrow: "\u2197",
    bg: "bg-green-100 dark:bg-green-950",
    text: "text-green-700 dark:text-green-400",
  },
  down: {
    label: "Falling",
    arrow: "\u2198",
    bg: "bg-red-100 dark:bg-red-950",
    text: "text-red-700 dark:text-red-400",
  },
  stable: {
    label: "Stable",
    arrow: "\u2192",
    bg: "bg-muted",
    text: "text-muted-foreground",
  },
} as const;

export function formatDelta(delta: number, trend: Trend): string {
  const abs = Math.abs(delta).toFixed(1);
  if (trend === "up") return `+${abs}%`;
  if (trend === "down") return `-${abs}%`;
  return `${abs}%`;
}

/**
 * Pill-shaped trend badge with arrow, label ("Rising" / "Falling" / "Stable"),
 * and formatted delta percentage.
 */
export function TrendBadge({ delta, trend, className }: TrendBadgeProps) {
  const config = trendConfig[trend];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5",
        "font-mono text-[0.6875rem] font-bold leading-none",
        config.bg,
        config.text,
        className,
      )}
    >
      <span aria-hidden="true">{config.arrow}</span>
      <span>{config.label}</span>
      <span>{formatDelta(delta, trend)}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------

interface WowDeltaProps {
  delta: number;
  trend: Trend;
  className?: string;
}

/**
 * Compact inline badge that only shows the delta value (e.g. "+1.3%").
 */
export function WowDelta({ delta, trend, className }: WowDeltaProps) {
  const config = trendConfig[trend];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-1.5 py-0.5",
        "font-mono text-[0.6875rem] font-bold leading-none",
        config.bg,
        config.text,
        className,
      )}
    >
      {formatDelta(delta, trend)}
    </span>
  );
}
