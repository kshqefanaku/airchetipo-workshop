"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TrendChartProps {
  data: Array<{
    archetypeId: string;
    archetypeName: string;
    metaShare: number;
    scrapedAt: string;
  }>;
  className?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LINE_COLORS = [
  "#f87171", // red
  "#22c55e", // green
  "#a1a1aa", // gray
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
] as const;

const MAX_LINES = 8;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Round an ISO date string to YYYY-MM-DD. */
function toDateKey(isoString: string): string {
  return new Date(isoString).toISOString().slice(0, 10);
}

/** Format "2024-03-03" → "Mar 3". */
function formatDateLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TrendChart({ data, className }: TrendChartProps) {
  const { chartData, topArchetypes } = useMemo(() => {
    if (data.length === 0) return { chartData: [], topArchetypes: [] };

    // 1. Determine the latest date so we can rank archetypes by most recent share
    const latestDate = data.reduce((latest, d) => {
      const key = toDateKey(d.scrapedAt);
      return key > latest ? key : latest;
    }, "");

    // 2. Rank archetypes by latest meta share and pick top N
    const latestShares = new Map<string, { name: string; share: number }>();
    for (const d of data) {
      if (toDateKey(d.scrapedAt) === latestDate) {
        latestShares.set(d.archetypeId, {
          name: d.archetypeName,
          share: d.metaShare,
        });
      }
    }

    const top = [...latestShares.entries()]
      .sort((a, b) => b[1].share - a[1].share)
      .slice(0, MAX_LINES)
      .map(([id, { name }]) => ({ id, name }));

    const topIds = new Set(top.map((t) => t.id));

    // 3. Group data by date, keeping only top archetypes
    const byDate = new Map<string, Record<string, number>>();
    for (const d of data) {
      if (!topIds.has(d.archetypeId)) continue;
      const key = toDateKey(d.scrapedAt);
      if (!byDate.has(key)) byDate.set(key, {});
      const row = byDate.get(key)!;
      row[d.archetypeId] = d.metaShare;
    }

    // 4. Sort by date and build chart-ready rows
    const sorted = [...byDate.entries()].sort((a, b) =>
      a[0].localeCompare(b[0]),
    );

    const rows = sorted.map(([dateKey, shares]) => ({
      date: formatDateLabel(dateKey),
      ...shares,
    }));

    return { chartData: rows, topArchetypes: top };
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div
        className={cn(
          "flex h-[220px] items-center justify-center text-sm text-muted-foreground",
          className,
        )}
      >
        No trend data available
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart
          data={chartData}
          margin={{ top: 4, right: 8, bottom: 4, left: -8 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />

          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />

          <YAxis
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v}%`}
          />

          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid hsl(var(--border))",
              background: "hsl(var(--popover))",
              color: "hsl(var(--popover-foreground))",
            }}
            formatter={(value) => `${Number(value).toFixed(1)}%`}
            labelStyle={{ fontWeight: 600, marginBottom: 4 }}
          />

          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          />

          {topArchetypes.map((arch, i) => (
            <Line
              key={arch.id}
              type="monotone"
              dataKey={arch.id}
              name={arch.name}
              stroke={LINE_COLORS[i % LINE_COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
