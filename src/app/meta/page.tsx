import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/user";
import { getMetaAnalysis } from "@/lib/services/meta-analysis";
import type { ArchetypeRow, Trend } from "@/lib/services/meta-analysis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetaShareChart } from "@/components/meta-charts/meta-share-chart";
import { TrendChart } from "@/components/meta-charts/trend-chart";
import { TrendBadge, WowDelta } from "@/components/meta-charts/trend-badge";

export const dynamic = "force-dynamic";

export default async function MetaDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");

  const { archetypes: archetypeRows, history: historyRows, summary } =
    await getMetaAnalysis();

  const topDeck = summary.topDeck;
  const biggestMover = summary.biggestMover;

  const totalArchetypes = archetypeRows.length;
  const gainers = archetypeRows
    .filter((a) => a.trend === "up")
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 3);
  const losers = archetypeRows
    .filter((a) => a.trend === "down")
    .sort((a, b) => a.delta - b.delta)
    .slice(0, 3);

  const maxShare = archetypeRows[0]?.currentShare ?? 1;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      {/* ── Page Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meta Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Current meta shares with weekly trends &mdash; Modern format
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-[0.6875rem] font-semibold text-green-700 dark:bg-green-950 dark:text-green-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-600 dark:bg-green-400" />
            Auto-updating
          </span>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Total Archetypes"
          value={String(totalArchetypes)}
          accent="blue"
        />
        <KpiCard
          label="Top Deck Share"
          value={topDeck ? `${topDeck.share.toFixed(1)}%` : "—"}
          subtext={topDeck?.name}
          delta={archetypeRows[0]?.delta}
          trend={archetypeRows[0]?.trend}
          accent="amber"
        />
        <KpiCard
          label="Diversity Index"
          value={totalArchetypes > 0 ? diversityIndex(archetypeRows).toFixed(2) : "—"}
          subtext="Shannon entropy"
          accent="green"
        />
        <KpiCard
          label="Biggest Mover"
          value={biggestMover?.name ?? "—"}
          delta={biggestMover?.delta}
          trend={biggestMover?.trend as Trend | undefined}
          subtext="Week-over-week change"
          accent="purple"
        />
      </div>

      {/* ── Charts Grid ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold">
              Meta Share Trend (30 Days)
            </CardTitle>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[0.6875rem] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-400">
              Top 8
            </span>
          </CardHeader>
          <CardContent>
            <TrendChart data={historyRows} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold">
              Current Meta Shares
            </CardTitle>
            <span className="font-mono text-xs text-muted-foreground">
              Top {Math.min(archetypeRows.length, 10)} archetypes
            </span>
          </CardHeader>
          <CardContent>
            <MetaShareChart data={archetypeRows.slice(0, 10)} />
          </CardContent>
        </Card>
      </div>

      {/* ── Weekly Summary Cards ── */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[0.6875rem] font-semibold uppercase tracking-wider text-green-700 dark:text-green-400">
              Biggest Gainers This Week
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0 divide-y">
            {gainers.length === 0 && (
              <p className="py-2 text-sm text-muted-foreground">No gainers</p>
            )}
            {gainers.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between py-2"
              >
                <span className="text-sm font-medium">{a.name}</span>
                <span className="font-mono text-xs font-bold text-green-700 dark:text-green-400">
                  +{a.delta.toFixed(1)}%
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[0.6875rem] font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">
              Biggest Losers This Week
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0 divide-y">
            {losers.length === 0 && (
              <p className="py-2 text-sm text-muted-foreground">No losers</p>
            )}
            {losers.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between py-2"
              >
                <span className="text-sm font-medium">{a.name}</span>
                <span className="font-mono text-xs font-bold text-red-700 dark:text-red-400">
                  {a.delta.toFixed(1)}%
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[0.6875rem] font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-400">
              Noteworthy Movements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0 divide-y">
            {topDeck && archetypeRows.length >= 2 && (
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium">
                  {archetypeRows[0].name} leads at{" "}
                  {archetypeRows[0].currentShare.toFixed(1)}%
                </span>
                <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-400">
                  #1
                </span>
              </div>
            )}
            {biggestMover && biggestMover.trend === "up" && (
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium">
                  {biggestMover.name} surging
                </span>
                <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-400">
                  +{biggestMover.delta.toFixed(1)}%
                </span>
              </div>
            )}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium">
                Diversity index{" "}
                {totalArchetypes > 0
                  ? diversityIndex(archetypeRows).toFixed(2)
                  : "N/A"}
              </span>
              <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-400">
                {totalArchetypes > 0 &&
                diversityIndex(archetypeRows) > 0.7
                  ? "Healthy"
                  : "Low"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Archetype Breakdown Table ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold">
            Archetype Breakdown &mdash; Weekly Trends
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            Week-over-week comparison
          </span>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="whitespace-nowrap px-4 py-2.5 text-left text-[0.6875rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  #
                </th>
                <th className="whitespace-nowrap px-4 py-2.5 text-left text-[0.6875rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  Archetype
                </th>
                <th className="whitespace-nowrap px-4 py-2.5 text-left text-[0.6875rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  Meta Share
                </th>
                <th className="whitespace-nowrap px-4 py-2.5 text-center text-[0.6875rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  WoW Change
                </th>
                <th className="whitespace-nowrap px-4 py-2.5 text-center text-[0.6875rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody>
              {archetypeRows.map((row, i) => (
                <tr
                  key={row.id}
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="min-w-[42px] font-mono text-sm font-semibold">
                        {row.currentShare.toFixed(1)}%
                      </span>
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{
                            width: `${(row.currentShare / maxShare) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <WowDelta delta={row.delta} trend={row.trend} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <TrendBadge delta={row.delta} trend={row.trend} />
                  </td>
                </tr>
              ))}
              {archetypeRows.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No meta data available. Run the scraper to import data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Helper Components ── */

function KpiCard({
  label,
  value,
  subtext,
  delta,
  trend,
  accent,
}: {
  label: string;
  value: string;
  subtext?: string;
  delta?: number;
  trend?: Trend;
  accent: "blue" | "amber" | "green" | "purple";
}) {
  const accentColors = {
    blue: "from-blue-500",
    amber: "from-amber-500",
    green: "from-green-500",
    purple: "from-purple-500",
  };

  return (
    <Card className="relative overflow-hidden">
      <div
        className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${accentColors[accent]} to-transparent`}
      />
      <CardContent className="pt-4">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-mono text-2xl font-bold">{value}</span>
          {delta !== undefined && trend && (
            <WowDelta delta={delta} trend={trend} />
          )}
        </div>
        {subtext && (
          <p className="mt-0.5 text-[0.6875rem] text-muted-foreground">
            {subtext}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/* Shannon diversity index (normalized) */
function diversityIndex(rows: ArchetypeRow[]): number {
  const total = rows.reduce((sum, r) => sum + r.currentShare, 0);
  if (total === 0 || rows.length <= 1) return 0;
  let entropy = 0;
  for (const r of rows) {
    const p = r.currentShare / total;
    if (p > 0) entropy -= p * Math.log(p);
  }
  return entropy / Math.log(rows.length);
}
