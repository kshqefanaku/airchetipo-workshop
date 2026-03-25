import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    card: {
      findMany: vi.fn(),
    },
  },
}));

function makeRequest(params: Record<string, string>) {
  const url = new URL("http://localhost:3000/api/cards/search");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url.toString());
}

function makeCard(name: string, id: string = "uuid-" + name) {
  return {
    id,
    scryfallId: "sf-" + name,
    name,
    manaCost: "{R}",
    cmc: 1,
    typeLine: "Instant",
    oracleText: "Test",
    imageUri: "https://img.scryfall.com/test.jpg",
    colors: ["R"],
    setCode: "m21",
    rarity: "common",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("GET /api/cards/search", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
  });

  it("returns 400 when q parameter is missing", async () => {
    const response = await GET(makeRequest({}));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("returns matching cards for exact name search", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.card.findMany).mockResolvedValue([
      makeCard("Lightning Bolt"),
    ]);

    const response = await GET(makeRequest({ q: "Lightning Bolt" }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.cards).toHaveLength(1);
    expect(body.cards[0].name).toBe("Lightning Bolt");
    expect(body.nextCursor).toBeNull();
  });

  it("returns empty array when no cards match", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.card.findMany).mockResolvedValue([]);

    const response = await GET(makeRequest({ q: "xyznonexistent" }));
    const body = await response.json();
    expect(body.cards).toHaveLength(0);
    expect(body.nextCursor).toBeNull();
  });

  it("handles partial name search", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.card.findMany).mockResolvedValue([
      makeCard("Lightning Bolt"),
      makeCard("Lightning Helix"),
    ]);

    const response = await GET(makeRequest({ q: "Light" }));
    const body = await response.json();
    expect(body.cards).toHaveLength(2);
  });

  it("uses case-insensitive search", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.card.findMany).mockResolvedValue([
      makeCard("Lightning Bolt"),
    ]);

    await GET(makeRequest({ q: "lightning bolt" }));

    expect(prisma.card.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          name: {
            contains: "lightning bolt",
            mode: "insensitive",
          },
        },
      })
    );
  });

  it("supports cursor-based pagination", async () => {
    const { prisma } = await import("@/lib/prisma");
    // Return 21 items to simulate hasMore
    const cards = Array.from({ length: 21 }, (_, i) =>
      makeCard(`Card ${i}`, `uuid-${i}`)
    );
    vi.mocked(prisma.card.findMany).mockResolvedValue(cards);

    const response = await GET(makeRequest({ q: "Card" }));
    const body = await response.json();
    expect(body.cards).toHaveLength(20);
    expect(body.nextCursor).toBe("uuid-19");
  });

  it("passes cursor to prisma when provided", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.card.findMany).mockResolvedValue([]);

    await GET(makeRequest({ q: "test", cursor: "some-cursor-id" }));

    expect(prisma.card.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        cursor: { id: "some-cursor-id" },
        skip: 1,
      })
    );
  });

  it("handles special characters in search query", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.card.findMany).mockResolvedValue([
      makeCard("Rix Maadi, Dungeon Palace"),
    ]);

    const response = await GET(makeRequest({ q: "Rix Maadi, Dungeon Palace" }));
    const body = await response.json();
    expect(body.cards).toHaveLength(1);
  });
});
