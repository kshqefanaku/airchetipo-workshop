"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";

interface MetaShareChartProps {
  data: Array<{
    name: string;
    currentShare: number;
  }>;
  className?: string;
}

/**
 * Gradient palette for the bars. Each entry is [bottomColor, topColor].
 * Uses muted, Tailwind-compatible hues that match the "Clean Clarity" design.
 */
const BAR_GRADIENTS = [
  ["#93c5fd", "#3b82f6"], // blue
  ["#86efac", "#22c55e"], // green
  ["#fca5a5", "#ef4444"], // red
  ["#fdba74", "#f97316"], // orange
  ["#c4b5fd", "#8b5cf6"], // violet
  ["#67e8f9", "#06b6d4"], // cyan
  ["#fde68a", "#eab308"], // yellow
  ["#f9a8d4", "#ec4899"], // pink
  ["#a5b4fc", "#6366f1"], // indigo
  ["#d9f99d", "#84cc16"], // lime
  ["#d4d4d8", "#71717a"], // zinc (for "Others")
] as const;

function gradientId(index: number) {
  return `meta-bar-grad-${index}`;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { name: string; currentShare: number } }>;
}) {
  if (!active || !payload?.length) return null;
  const { name, currentShare } = payload[0].payload;

  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-popover-foreground shadow-md">
      <p className="text-sm font-medium">{name}</p>
      <p className="font-mono text-xs text-muted-foreground">
        {currentShare.toFixed(1)}%
      </p>
    </div>
  );
}

function BarLabel({
  x,
  y,
  width,
  value,
}: {
  x?: number;
  y?: number;
  width?: number;
  value?: number;
}) {
  if (x == null || y == null || width == null || value == null) return null;

  return (
    <text
      x={x + width / 2}
      y={y - 6}
      fill="currentColor"
      className="text-muted-foreground"
      fontSize={10}
      fontFamily="var(--font-geist-mono, monospace)"
      textAnchor="middle"
    >
      {value.toFixed(1)}%
    </text>
  );
}

/**
 * Bar chart that visualizes current meta shares per archetype.
 *
 * Expects pre-sorted data (top 10 + optional "Others" bucket).
 * Title is handled by the parent component.
 */
export function MetaShareChart({ data, className }: MetaShareChartProps) {
  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={data}
          margin={{ top: 16, right: 8, bottom: 4, left: -16 }}
        >
          {/* Gradient definitions */}
          <defs>
            {data.map((_, i) => {
              const [bottom, top] =
                BAR_GRADIENTS[i % BAR_GRADIENTS.length];
              return (
                <linearGradient
                  key={gradientId(i)}
                  id={gradientId(i)}
                  x1="0"
                  y1="1"
                  x2="0"
                  y2="0"
                >
                  <stop offset="0%" stopColor={bottom} stopOpacity={0.6} />
                  <stop offset="100%" stopColor={top} stopOpacity={1} />
                </linearGradient>
              );
            })}
          </defs>

          <XAxis
            dataKey="name"
            tick={{ fontSize: 11 }}
            angle={-35}
            textAnchor="end"
            interval={0}
            height={60}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v: number) => `${v}%`}
            width={48}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
          />
          <Bar
            dataKey="currentShare"
            radius={[4, 4, 0, 0]}
            label={<BarLabel />}
            maxBarSize={48}
          >
            {data.map((_, i) => (
              <Cell
                key={`cell-${i}`}
                fill={`url(#${gradientId(i)})`}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
