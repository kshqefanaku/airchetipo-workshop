import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    archetype: { findUnique: vi.fn() },
    decklist: { findMany: vi.fn() },
  },
}));

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost:3000/api/cards/decklists");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url.toString());
}

describe("GET /api/cards/decklists", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 400 when archetype param is missing", async () => {
    const response = await GET(makeRequest({}));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("returns empty decklists array when archetype not found", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.archetype.findUnique).mockResolvedValue(null);

    const response = await GET(makeRequest({ archetype: "nonexistent" }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.decklists).toEqual([]);
  });

  it("returns decklists with entries for valid archetype slug", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.archetype.findUnique).mockResolvedValue({
      id: "arch-1",
      slug: "mono-red",
      name: "Mono Red",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    vi.mocked(prisma.decklist.findMany).mockResolvedValue([
      {
        id: "deck-1",
        playerName: "Alice",
        eventName: "FNM",
        eventDate: new Date("2025-01-15"),
        sourceUrl: "https://example.com/deck/1",
        entries: [
          { cardName: "Lightning Bolt", quantity: 4, section: "MAIN" },
          { cardName: "Mountain", quantity: 20, section: "MAIN" },
        ],
      },
    ] as never);

    const response = await GET(makeRequest({ archetype: "mono-red" }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.decklists).toHaveLength(1);
    expect(body.decklists[0].playerName).toBe("Alice");
    expect(body.decklists[0].entries).toHaveLength(2);
    expect(body.decklists[0].entries[0].cardName).toBe("Lightning Bolt");
  });

  it("returns 400 when limit is not a valid positive integer", async () => {
    const response = await GET(
      makeRequest({ archetype: "mono-red", limit: "-1" })
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();

    const response2 = await GET(
      makeRequest({ archetype: "mono-red", limit: "abc" })
    );
    expect(response2.status).toBe(400);

    const response3 = await GET(
      makeRequest({ archetype: "mono-red", limit: "0" })
    );
    expect(response3.status).toBe(400);
  });

  it("respects limit parameter", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.archetype.findUnique).mockResolvedValue({
      id: "arch-1",
      slug: "mono-red",
      name: "Mono Red",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    vi.mocked(prisma.decklist.findMany).mockResolvedValue([] as never);

    await GET(makeRequest({ archetype: "mono-red", limit: "3" }));

    expect(prisma.decklist.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 3,
      })
    );
  });
});
