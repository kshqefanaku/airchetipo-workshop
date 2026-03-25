import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: vi.fn(),
    archetype: { findMany: vi.fn() },
    metaSnapshot: { findMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { GET } from "../route";

// --- helpers ---

function makeArchetype(id: string, name: string, slug: string) {
  return { id, name, slug };
}

function makeSnapshot(
  archetypeId: string,
  metaShare: number,
  scrapedAt: Date = new Date()
) {
  return { archetypeId, metaShare, scrapedAt };
}

function makeHistoryRow(
  archetypeId: string,
  archetypeName: string,
  metaShare: number,
  scrapedAt: Date
) {
  return {
    archetypeId,
    metaShare,
    scrapedAt,
    archetype: { name: archetypeName },
  };
}

// --- tests ---

describe("GET /api/analysis/meta", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns archetypes sorted by currentShare descending", async () => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 8 * 86400000);

    // latest snapshots (1st $queryRaw call)
    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([
        makeSnapshot("a1", 10, now),
        makeSnapshot("a2", 25, now),
        makeSnapshot("a3", 15, now),
      ])
      // previous snapshots (2nd $queryRaw call)
      .mockResolvedValueOnce([
        makeSnapshot("a1", 8, weekAgo),
        makeSnapshot("a2", 26, weekAgo),
        makeSnapshot("a3", 14, weekAgo),
      ]);

    vi.mocked(prisma.archetype.findMany).mockResolvedValue([
      makeArchetype("a1", "Mono Red", "mono-red"),
      makeArchetype("a2", "Azorius Control", "azorius-control"),
      makeArchetype("a3", "Gruul Aggro", "gruul-aggro"),
    ] as never);

    vi.mocked(prisma.metaSnapshot.findMany).mockResolvedValue([] as never);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.archetypes).toHaveLength(3);
    // sorted descending by currentShare: 25, 15, 10
    expect(body.archetypes[0].name).toBe("Azorius Control");
    expect(body.archetypes[0].currentShare).toBe(25);
    expect(body.archetypes[1].name).toBe("Gruul Aggro");
    expect(body.archetypes[1].currentShare).toBe(15);
    expect(body.archetypes[2].name).toBe("Mono Red");
    expect(body.archetypes[2].currentShare).toBe(10);
  });

  it("calculates WoW delta correctly (current - previous)", async () => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 8 * 86400000);

    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([makeSnapshot("a1", 12.5, now)])
      .mockResolvedValueOnce([makeSnapshot("a1", 10.3, weekAgo)]);

    vi.mocked(prisma.archetype.findMany).mockResolvedValue([
      makeArchetype("a1", "Deck A", "deck-a"),
    ] as never);
    vi.mocked(prisma.metaSnapshot.findMany).mockResolvedValue([] as never);

    const response = await GET();
    const body = await response.json();

    // delta = 12.5 - 10.3 = 2.2, rounded to 2 decimal places
    expect(body.archetypes[0].delta).toBe(2.2);
    expect(body.archetypes[0].previousShare).toBe(10.3);
  });

  it('sets trend to "up" when delta > 0.5', async () => {
    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([makeSnapshot("a1", 10)])
      .mockResolvedValueOnce([makeSnapshot("a1", 9)]);

    vi.mocked(prisma.archetype.findMany).mockResolvedValue([
      makeArchetype("a1", "Deck A", "deck-a"),
    ] as never);
    vi.mocked(prisma.metaSnapshot.findMany).mockResolvedValue([] as never);

    const body = await (await GET()).json();
    // delta = 10 - 9 = 1 > 0.5
    expect(body.archetypes[0].trend).toBe("up");
  });

  it('sets trend to "down" when delta < -0.5', async () => {
    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([makeSnapshot("a1", 8)])
      .mockResolvedValueOnce([makeSnapshot("a1", 10)]);

    vi.mocked(prisma.archetype.findMany).mockResolvedValue([
      makeArchetype("a1", "Deck A", "deck-a"),
    ] as never);
    vi.mocked(prisma.metaSnapshot.findMany).mockResolvedValue([] as never);

    const body = await (await GET()).json();
    // delta = 8 - 10 = -2 < -0.5
    expect(body.archetypes[0].trend).toBe("down");
  });

  it('sets trend to "stable" when delta is between -0.5 and 0.5', async () => {
    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([makeSnapshot("a1", 10.3)])
      .mockResolvedValueOnce([makeSnapshot("a1", 10.1)]);

    vi.mocked(prisma.archetype.findMany).mockResolvedValue([
      makeArchetype("a1", "Deck A", "deck-a"),
    ] as never);
    vi.mocked(prisma.metaSnapshot.findMany).mockResolvedValue([] as never);

    const body = await (await GET()).json();
    // delta = 10.3 - 10.1 = 0.2 which is between -0.5 and 0.5
    expect(body.archetypes[0].delta).toBe(0.2);
    expect(body.archetypes[0].trend).toBe("stable");
  });

  it("handles archetype with no previous week data (delta=0, trend=stable, previousShare=null)", async () => {
    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([makeSnapshot("a1", 15)])
      // no previous snapshots
      .mockResolvedValueOnce([]);

    vi.mocked(prisma.archetype.findMany).mockResolvedValue([
      makeArchetype("a1", "New Deck", "new-deck"),
    ] as never);
    vi.mocked(prisma.metaSnapshot.findMany).mockResolvedValue([] as never);

    const body = await (await GET()).json();

    expect(body.archetypes[0].delta).toBe(0);
    expect(body.archetypes[0].trend).toBe("stable");
    expect(body.archetypes[0].previousShare).toBeNull();
  });

  it("returns empty arrays when no data exists", async () => {
    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    vi.mocked(prisma.archetype.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.metaSnapshot.findMany).mockResolvedValue([] as never);

    const body = await (await GET()).json();

    expect(body.archetypes).toEqual([]);
    expect(body.history).toEqual([]);
    expect(body.summary.totalArchetypes).toBe(0);
    expect(body.summary.topDeck).toBeNull();
    expect(body.summary.biggestMover).toBeNull();
  });

  it("returns 30-day history data", async () => {
    const day1 = new Date("2026-03-01T12:00:00Z");
    const day2 = new Date("2026-03-15T12:00:00Z");

    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([makeSnapshot("a1", 20)])
      .mockResolvedValueOnce([]);

    vi.mocked(prisma.archetype.findMany).mockResolvedValue([
      makeArchetype("a1", "Deck A", "deck-a"),
    ] as never);

    vi.mocked(prisma.metaSnapshot.findMany).mockResolvedValue([
      makeHistoryRow("a1", "Deck A", 18, day1),
      makeHistoryRow("a1", "Deck A", 20, day2),
    ] as never);

    const body = await (await GET()).json();

    expect(body.history).toHaveLength(2);
    expect(body.history[0].archetypeId).toBe("a1");
    expect(body.history[0].archetypeName).toBe("Deck A");
    expect(body.history[0].metaShare).toBe(18);
    expect(body.history[1].metaShare).toBe(20);
  });

  it("summary includes totalArchetypes, topDeck, and biggestMover", async () => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 8 * 86400000);

    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([
        makeSnapshot("a1", 20, now),
        makeSnapshot("a2", 15, now),
      ])
      .mockResolvedValueOnce([
        makeSnapshot("a1", 19.5, weekAgo), // delta 0.5 -> stable
        makeSnapshot("a2", 10, weekAgo), // delta 5 -> up, biggest mover
      ]);

    vi.mocked(prisma.archetype.findMany).mockResolvedValue([
      makeArchetype("a1", "Top Deck", "top-deck"),
      makeArchetype("a2", "Rising Deck", "rising-deck"),
    ] as never);
    vi.mocked(prisma.metaSnapshot.findMany).mockResolvedValue([] as never);

    const body = await (await GET()).json();

    expect(body.summary.totalArchetypes).toBe(2);
    // topDeck is the one with highest currentShare
    expect(body.summary.topDeck).toEqual({ name: "Top Deck", share: 20 });
    // biggestMover has largest |delta|: Rising Deck with delta=5
    expect(body.summary.biggestMover).toEqual({
      name: "Rising Deck",
      delta: 5,
      trend: "up",
    });
  });

  it("returns 500 when an error is thrown", async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(
      new Error("DB connection lost")
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await GET();

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Failed to fetch meta analysis");
  });
});
