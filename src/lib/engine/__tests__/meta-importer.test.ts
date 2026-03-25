import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../scraper", () => ({
  scrapeModernMeta: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
  },
}));

function makeArchetypeRow(slug: string, name: string) {
  return {
    id: `arch-${slug}`,
    name,
    slug,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("importMeta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("successfully processes archetypes and returns correct summary", async () => {
    const { scrapeModernMeta } = await import("../scraper");
    const { prisma } = await import("@/lib/prisma");
    const { importMeta } = await import("../meta-importer");

    vi.mocked(scrapeModernMeta).mockResolvedValue([
      { name: "Boros Energy", slug: "modern-boros-energy", metaShare: 12.5 },
      { name: "Jeskai Control", slug: "modern-jeskai-control", metaShare: 8.3 },
      { name: "Golgari Yawgmoth", slug: "modern-golgari-yawgmoth", metaShare: 6.1 },
    ]);

    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
      const tx = {
        archetype: {
          upsert: vi.fn()
            .mockResolvedValueOnce(makeArchetypeRow("modern-boros-energy", "Boros Energy"))
            .mockResolvedValueOnce(makeArchetypeRow("modern-jeskai-control", "Jeskai Control"))
            .mockResolvedValueOnce(makeArchetypeRow("modern-golgari-yawgmoth", "Golgari Yawgmoth")),
        },
        metaSnapshot: {
          create: vi.fn().mockResolvedValue({}),
        },
      };
      return fn(tx);
    });

    const result = await importMeta();

    expect(result).toEqual({
      archetypesProcessed: 3,
      snapshotsCreated: 3,
      errors: 0,
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(3);
  });

  it("creates snapshots with correct archetypeId and metaShare", async () => {
    const { scrapeModernMeta } = await import("../scraper");
    const { prisma } = await import("@/lib/prisma");
    const { importMeta } = await import("../meta-importer");

    vi.mocked(scrapeModernMeta).mockResolvedValue([
      { name: "Boros Energy", slug: "modern-boros-energy", metaShare: 12.5 },
    ]);

    const mockCreate = vi.fn().mockResolvedValue({});
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
      const tx = {
        archetype: {
          upsert: vi.fn().mockResolvedValue(makeArchetypeRow("modern-boros-energy", "Boros Energy")),
        },
        metaSnapshot: { create: mockCreate },
      };
      return fn(tx);
    });

    await importMeta();

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        archetypeId: "arch-modern-boros-energy",
        metaShare: 12.5,
        source: "mtggoldfish",
      },
    });
  });

  it("errors in one archetype don't block others", async () => {
    const { scrapeModernMeta } = await import("../scraper");
    const { prisma } = await import("@/lib/prisma");
    const { importMeta } = await import("../meta-importer");

    vi.mocked(scrapeModernMeta).mockResolvedValue([
      { name: "Boros Energy", slug: "modern-boros-energy", metaShare: 12.5 },
      { name: "Jeskai Control", slug: "modern-jeskai-control", metaShare: 8.3 },
      { name: "Golgari Yawgmoth", slug: "modern-golgari-yawgmoth", metaShare: 6.1 },
    ]);

    let callCount = 0;
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
      callCount++;
      if (callCount === 2) {
        throw new Error("DB constraint violation");
      }
      const slug = callCount === 1 ? "modern-boros-energy" : "modern-golgari-yawgmoth";
      const name = callCount === 1 ? "Boros Energy" : "Golgari Yawgmoth";
      const tx = {
        archetype: {
          upsert: vi.fn().mockResolvedValue(makeArchetypeRow(slug, name)),
        },
        metaSnapshot: { create: vi.fn().mockResolvedValue({}) },
      };
      return fn(tx);
    });

    const result = await importMeta();

    expect(result.archetypesProcessed).toBe(2);
    expect(result.snapshotsCreated).toBe(2);
    expect(result.errors).toBe(1);
    expect(prisma.$transaction).toHaveBeenCalledTimes(3);
  });

  it("summary has correct counts matching processed items", async () => {
    const { scrapeModernMeta } = await import("../scraper");
    const { prisma } = await import("@/lib/prisma");
    const { importMeta } = await import("../meta-importer");

    vi.mocked(scrapeModernMeta).mockResolvedValue([
      { name: "Boros Energy", slug: "modern-boros-energy", metaShare: 12.5 },
      { name: "Jeskai Control", slug: "modern-jeskai-control", metaShare: 8.3 },
    ]);

    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
      const tx = {
        archetype: {
          upsert: vi.fn().mockResolvedValue(makeArchetypeRow("any", "Any")),
        },
        metaSnapshot: { create: vi.fn().mockResolvedValue({}) },
      };
      return fn(tx);
    });

    const result = await importMeta();

    expect(result).toHaveProperty("archetypesProcessed", 2);
    expect(result).toHaveProperty("snapshotsCreated", 2);
    expect(result).toHaveProperty("errors", 0);
  });

  it("empty scrape result returns zero counts", async () => {
    const { scrapeModernMeta } = await import("../scraper");
    const { prisma } = await import("@/lib/prisma");
    const { importMeta } = await import("../meta-importer");

    vi.mocked(scrapeModernMeta).mockResolvedValue([]);

    const result = await importMeta();

    expect(result).toEqual({
      archetypesProcessed: 0,
      snapshotsCreated: 0,
      errors: 0,
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
