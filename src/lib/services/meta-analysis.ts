import { prisma } from "@/lib/prisma";

export type Trend = "up" | "down" | "stable";

export interface ArchetypeRow {
  id: string;
  name: string;
  slug: string;
  currentShare: number;
  previousShare: number | null;
  delta: number;
  trend: Trend;
}

export interface HistoryRow {
  archetypeId: string;
  archetypeName: string;
  metaShare: number;
  scrapedAt: string;
}

export interface MetaSummary {
  totalArchetypes: number;
  topDeck: { name: string; share: number } | null;
  biggestMover: { name: string; delta: number; trend: Trend } | null;
}

export interface MetaAnalysis {
  archetypes: ArchetypeRow[];
  history: HistoryRow[];
  summary: MetaSummary;
}

export async function getMetaAnalysis(): Promise<MetaAnalysis> {
  // 1. Latest snapshot per archetype (current share)
  const latestSnapshots = await prisma.$queryRaw<
    { archetypeId: string; metaShare: number; scrapedAt: Date }[]
  >`
    SELECT DISTINCT ON ("archetypeId")
      "archetypeId",
      "metaShare",
      "scrapedAt"
    FROM "meta_snapshots"
    ORDER BY "archetypeId", "scrapedAt" DESC
  `;

  // 2. Previous week snapshots
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const previousSnapshots = await prisma.$queryRaw<
    { archetypeId: string; metaShare: number }[]
  >`
    SELECT DISTINCT ON ("archetypeId")
      "archetypeId",
      "metaShare"
    FROM "meta_snapshots"
    WHERE "scrapedAt" <= ${sevenDaysAgo}
    ORDER BY "archetypeId", "scrapedAt" DESC
  `;

  const previousShareMap = new Map(
    previousSnapshots.map((s) => [s.archetypeId, Number(s.metaShare)])
  );

  // 3. Archetype details
  const archetypeIds = latestSnapshots.map((s) => s.archetypeId);
  const archetypesData = await prisma.archetype.findMany({
    where: { id: { in: archetypeIds } },
  });
  const archetypeMap = new Map(archetypesData.map((a) => [a.id, a]));

  // 4. Build rows with delta and trend
  const archetypes: ArchetypeRow[] = latestSnapshots
    .map((snapshot) => {
      const archetype = archetypeMap.get(snapshot.archetypeId);
      if (!archetype) return null;

      const currentShare = Number(snapshot.metaShare);
      const previousShare = previousShareMap.get(snapshot.archetypeId) ?? null;
      const delta =
        previousShare !== null
          ? Math.round((currentShare - previousShare) * 100) / 100
          : 0;

      let trend: Trend = "stable";
      if (delta > 0.5) trend = "up";
      else if (delta < -0.5) trend = "down";

      return {
        id: archetype.id,
        name: archetype.name,
        slug: archetype.slug,
        currentShare,
        previousShare,
        delta,
        trend,
      };
    })
    .filter((r): r is ArchetypeRow => r !== null)
    .sort((a, b) => b.currentShare - a.currentShare);

  // 5. History (30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const historyData = await prisma.metaSnapshot.findMany({
    where: { scrapedAt: { gte: thirtyDaysAgo } },
    select: {
      archetypeId: true,
      metaShare: true,
      scrapedAt: true,
      archetype: { select: { name: true } },
    },
    orderBy: { scrapedAt: "asc" },
  });

  const history: HistoryRow[] = historyData.map((h) => ({
    archetypeId: h.archetypeId,
    archetypeName: h.archetype.name,
    metaShare: h.metaShare,
    scrapedAt: h.scrapedAt.toISOString(),
  }));

  // 6. Summary
  const topDeck = archetypes[0] ?? null;
  const biggestMover = archetypes.length
    ? archetypes.reduce((max, row) =>
        Math.abs(row.delta) > Math.abs(max.delta) ? row : max
      )
    : null;

  return {
    archetypes,
    history,
    summary: {
      totalArchetypes: archetypes.length,
      topDeck: topDeck
        ? { name: topDeck.name, share: topDeck.currentShare }
        : null,
      biggestMover: biggestMover
        ? {
            name: biggestMover.name,
            delta: biggestMover.delta,
            trend: biggestMover.trend,
          }
        : null,
    },
  };
}
