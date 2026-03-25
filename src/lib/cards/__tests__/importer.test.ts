import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NormalizedCard } from "../types";

function makeNormalizedCard(overrides: Partial<NormalizedCard> = {}): NormalizedCard {
  return {
    scryfallId: "test-id",
    name: "Lightning Bolt",
    manaCost: "{R}",
    cmc: 1,
    typeLine: "Instant",
    oracleText: "Lightning Bolt deals 3 damage to any target.",
    imageUri: "https://img.scryfall.com/test.jpg",
    colors: ["R"],
    setCode: "m21",
    rarity: "uncommon",
    ...overrides,
  };
}

vi.mock("../scryfall", () => ({
  fetchModernCards: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $executeRaw: vi.fn(),
  },
}));

describe("importCards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("imports cards in batches and returns summary", async () => {
    const { fetchModernCards } = await import("../scryfall");
    const { prisma } = await import("@/lib/prisma");
    const { importCards } = await import("../importer");

    const cards = Array.from({ length: 3 }, (_, i) =>
      makeNormalizedCard({ scryfallId: `id-${i}`, name: `Card ${i}` })
    );

    vi.mocked(fetchModernCards).mockResolvedValue(cards);
    vi.mocked(prisma.$executeRaw).mockResolvedValue(3);

    const result = await importCards();

    expect(result).toEqual({ imported: 3, errors: 0, total: 3 });
    expect(prisma.$executeRaw).toHaveBeenCalledOnce();
  });

  it("handles batch failures and counts errors", async () => {
    const { fetchModernCards } = await import("../scryfall");
    const { prisma } = await import("@/lib/prisma");
    const { importCards } = await import("../importer");

    const cards = Array.from({ length: 600 }, (_, i) =>
      makeNormalizedCard({ scryfallId: `id-${i}`, name: `Card ${i}` })
    );

    vi.mocked(fetchModernCards).mockResolvedValue(cards);
    vi.mocked(prisma.$executeRaw)
      .mockResolvedValueOnce(500)
      .mockRejectedValueOnce(new Error("DB error"));

    const result = await importCards();

    expect(result.imported).toBe(500);
    expect(result.errors).toBe(100);
    expect(result.total).toBe(600);
  });

  it("uses one raw SQL call per batch", async () => {
    const { fetchModernCards } = await import("../scryfall");
    const { prisma } = await import("@/lib/prisma");
    const { importCards } = await import("../importer");

    const cards = Array.from({ length: 600 }, (_, i) =>
      makeNormalizedCard({ scryfallId: `id-${i}`, name: `Card ${i}` })
    );

    vi.mocked(fetchModernCards).mockResolvedValue(cards);
    vi.mocked(prisma.$executeRaw).mockResolvedValue(500);

    await importCards();

    // 600 cards / 500 batch size = 2 batches
    expect(prisma.$executeRaw).toHaveBeenCalledTimes(2);
  });
});
