import { describe, it, expect, vi, beforeEach } from "vitest";
import { importDecklists } from "../decklist-importer";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    archetype: { findMany: vi.fn() },
    $transaction: vi.fn(),
    decklist: { upsert: vi.fn() },
    decklistEntry: { deleteMany: vi.fn(), createMany: vi.fn() },
  },
}));

vi.mock("../decklist-scraper", () => ({
  scrapeDecklists: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { scrapeDecklists } from "../decklist-scraper";

const mockedFindMany = prisma.archetype.findMany as ReturnType<typeof vi.fn>;
const mockedScrapeDecklists = scrapeDecklists as ReturnType<typeof vi.fn>;
const mockedTransaction = prisma.$transaction as ReturnType<typeof vi.fn>;

describe("importDecklists", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    // Reset mock implementations
    mockedFindMany.mockReset();
    mockedScrapeDecklists.mockReset();
    mockedTransaction.mockReset();
  });

  it("processes archetypes and returns correct summary counts", async () => {
    mockedFindMany.mockResolvedValue([
      { id: "id-1", name: "Burn", slug: "modern-burn" },
      { id: "id-2", name: "Tron", slug: "modern-tron" },
    ]);

    mockedScrapeDecklists
      .mockResolvedValueOnce([
        {
          playerName: "Alice",
          eventName: "Challenge",
          eventDate: "2025-03-15",
          sourceUrl: "https://www.mtggoldfish.com/deck/111",
          entries: [{ cardName: "Lightning Bolt", quantity: 4, section: "MAIN" }],
          needsReview: false,
        },
        {
          playerName: "Bob",
          eventName: "League",
          eventDate: null,
          sourceUrl: "https://www.mtggoldfish.com/deck/222",
          entries: [{ cardName: "Goblin Guide", quantity: 4, section: "MAIN" }],
          needsReview: false,
        },
      ])
      .mockResolvedValueOnce([
        {
          playerName: null,
          eventName: null,
          eventDate: null,
          sourceUrl: "https://www.mtggoldfish.com/deck/333",
          entries: [{ cardName: "Karn Liberated", quantity: 4, section: "MAIN" }],
          needsReview: false,
        },
      ]);

    // Each $transaction call succeeds — simulate the callback being invoked
    mockedTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
      const tx = {
        decklist: {
          upsert: vi.fn().mockResolvedValue({ id: "dl-1" }),
        },
        decklistEntry: {
          deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
          createMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      };
      return fn(tx);
    });

    const summary = await importDecklists();

    expect(summary.archetypesProcessed).toBe(2);
    expect(summary.decklistsImported).toBe(3);
    expect(summary.errors).toBe(0);
    expect(mockedScrapeDecklists).toHaveBeenCalledTimes(2);
  });

  it("handles scraper errors gracefully (errors count incremented)", async () => {
    mockedFindMany.mockResolvedValue([
      { id: "id-1", name: "Burn", slug: "modern-burn" },
      { id: "id-2", name: "Tron", slug: "modern-tron" },
    ]);

    mockedScrapeDecklists
      .mockRejectedValueOnce(new Error("Network failure"))
      .mockResolvedValueOnce([
        {
          playerName: null,
          eventName: null,
          eventDate: null,
          sourceUrl: "https://www.mtggoldfish.com/deck/333",
          entries: [{ cardName: "Karn Liberated", quantity: 4, section: "MAIN" }],
          needsReview: false,
        },
      ]);

    mockedTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
      const tx = {
        decklist: {
          upsert: vi.fn().mockResolvedValue({ id: "dl-1" }),
        },
        decklistEntry: {
          deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
          createMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      };
      return fn(tx);
    });

    const summary = await importDecklists();

    expect(summary.archetypesProcessed).toBe(1);
    expect(summary.decklistsImported).toBe(1);
    expect(summary.errors).toBe(1);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("Failed to process Burn"),
      expect.any(Error)
    );
  });

  it("returns zero counts when no archetypes exist", async () => {
    mockedFindMany.mockResolvedValue([]);

    const summary = await importDecklists();

    expect(summary.archetypesProcessed).toBe(0);
    expect(summary.decklistsImported).toBe(0);
    expect(summary.errors).toBe(0);
    expect(mockedScrapeDecklists).not.toHaveBeenCalled();
  });
});
