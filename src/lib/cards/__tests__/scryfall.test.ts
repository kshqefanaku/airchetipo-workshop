import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchModernCards, normalizeScryfallCard } from "../scryfall";
import type { ScryfallCard } from "../types";

function makeScryfallCard(overrides: Partial<ScryfallCard> = {}): ScryfallCard {
  return {
    id: "test-scryfall-id",
    name: "Lightning Bolt",
    mana_cost: "{R}",
    cmc: 1,
    type_line: "Instant",
    oracle_text: "Lightning Bolt deals 3 damage to any target.",
    colors: ["R"],
    set: "m21",
    rarity: "uncommon",
    legalities: { modern: "legal", standard: "not_legal" },
    image_uris: { normal: "https://img.scryfall.com/test.jpg" },
    layout: "normal",
    ...overrides,
  };
}

describe("normalizeScryfallCard", () => {
  it("normalizes a standard card", () => {
    const card = makeScryfallCard();
    const result = normalizeScryfallCard(card);

    expect(result).toEqual({
      scryfallId: "test-scryfall-id",
      name: "Lightning Bolt",
      manaCost: "{R}",
      cmc: 1,
      typeLine: "Instant",
      oracleText: "Lightning Bolt deals 3 damage to any target.",
      imageUri: "https://img.scryfall.com/test.jpg",
      colors: ["R"],
      setCode: "m21",
      rarity: "uncommon",
    });
  });

  it("handles double-faced cards (no top-level image_uris)", () => {
    const card = makeScryfallCard({
      name: "Delver of Secrets // Insectile Aberration",
      image_uris: undefined,
      mana_cost: undefined,
      oracle_text: undefined,
      card_faces: [
        {
          name: "Delver of Secrets",
          mana_cost: "{U}",
          oracle_text: "At the beginning of your upkeep, look at the top card.",
          image_uris: { normal: "https://img.scryfall.com/delver-front.jpg" },
        },
        {
          name: "Insectile Aberration",
          mana_cost: "",
          oracle_text: "Flying",
          image_uris: { normal: "https://img.scryfall.com/delver-back.jpg" },
        },
      ],
      layout: "transform",
    });

    const result = normalizeScryfallCard(card);

    expect(result.manaCost).toBe("{U}");
    expect(result.oracleText).toBe("At the beginning of your upkeep, look at the top card.");
    expect(result.imageUri).toBe("https://img.scryfall.com/delver-front.jpg");
  });

  it("handles cards with no mana cost", () => {
    const card = makeScryfallCard({ mana_cost: undefined });
    const result = normalizeScryfallCard(card);
    expect(result.manaCost).toBeNull();
  });

  it("handles cards with no oracle text", () => {
    const card = makeScryfallCard({ oracle_text: undefined });
    const result = normalizeScryfallCard(card);
    expect(result.oracleText).toBeNull();
  });
});

describe("fetchModernCards", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("fetches cards via search API with pagination", async () => {
    const card1 = makeScryfallCard({ id: "card-1", name: "Bolt" });
    const card2 = makeScryfallCard({ id: "card-2", name: "Helix" });

    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [card1],
            has_more: true,
            next_page: "https://api.scryfall.com/cards/search?page=2",
            total_cards: 2,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [card2],
            has_more: false,
            total_cards: 2,
          }),
        })
    );

    const result = await fetchModernCards();

    expect(result).toHaveLength(2);
    expect(result[0].scryfallId).toBe("card-1");
    expect(result[1].scryfallId).toBe("card-2");
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("fetches single page when has_more is false", async () => {
    const card = makeScryfallCard({ id: "only-card" });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [card],
          has_more: false,
          total_cards: 1,
        }),
      })
    );

    const result = await fetchModernCards();

    expect(result).toHaveLength(1);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("throws on search API failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({ ok: false, status: 500 })
    );

    await expect(fetchModernCards()).rejects.toThrow(
      "Scryfall search failed: 500"
    );
  });
});
