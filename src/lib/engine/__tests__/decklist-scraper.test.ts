import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchArchetypePage,
  parseDecklists,
  scrapeDecklists,
} from "../decklist-scraper";

const FIXTURE_HTML = `
<html>
<body>
  <div class="archetype-decks">
    <div class="deck-header">
      <a href="/player/JohnDoe">JohnDoe</a>
      <a href="/tournament/modern-challenge">Modern Challenge</a>
      <span class="deck-date">2025-03-15</span>
    </div>
    <div class="deck-list-container">
      <a href="/deck/12345">View Deck</a>
      <table class="deck-table">
        <tr>
          <td class="deck-col-qty">4</td>
          <td class="deck-col-card"><a href="/price/paper/Lightning+Bolt">Lightning Bolt</a></td>
        </tr>
        <tr>
          <td class="deck-col-qty">3</td>
          <td class="deck-col-card"><a href="/price/paper/Ragavan">Ragavan, Nimble Pilferer</a></td>
        </tr>
        <tr>
          <td class="deck-header" colspan="2">Sideboard (15)</td>
        </tr>
        <tr>
          <td class="deck-col-qty">2</td>
          <td class="deck-col-card"><a href="/price/paper/Blood+Moon">Blood Moon</a></td>
        </tr>
      </table>
    </div>
  </div>
</body>
</html>
`;

const EMPTY_DECK_FIXTURE = `
<html>
<body>
  <div class="archetype-decks">
    <div class="deck-list-container">
      <table class="deck-table">
      </table>
    </div>
  </div>
</body>
</html>
`;

describe("parseDecklists", () => {
  it("correctly parses main deck and sideboard entries", () => {
    const result = parseDecklists(FIXTURE_HTML, "modern-burn", "https://www.mtggoldfish.com");

    expect(result).toHaveLength(1);
    expect(result[0].needsReview).toBe(false);
    expect(result[0].sourceUrl).toBe("https://www.mtggoldfish.com/deck/12345");

    const mainEntries = result[0].entries.filter((e) => e.section === "MAIN");
    const sideboardEntries = result[0].entries.filter((e) => e.section === "SIDEBOARD");

    expect(mainEntries).toHaveLength(2);
    expect(mainEntries[0]).toEqual({
      cardName: "Lightning Bolt",
      quantity: 4,
      section: "MAIN",
    });
    expect(mainEntries[1]).toEqual({
      cardName: "Ragavan, Nimble Pilferer",
      quantity: 3,
      section: "MAIN",
    });

    expect(sideboardEntries).toHaveLength(1);
    expect(sideboardEntries[0]).toEqual({
      cardName: "Blood Moon",
      quantity: 2,
      section: "SIDEBOARD",
    });
  });

  it("returns empty array for HTML with no deck containers", () => {
    const noDecksHtml = `
      <html><body>
        <div class="something-else">
          <p>No decks here</p>
        </div>
      </body></html>
    `;

    const result = parseDecklists(noDecksHtml, "modern-burn", "https://www.mtggoldfish.com");
    expect(result).toEqual([]);
  });

  it("returns entry with needsReview=true when parsing yields empty entries", () => {
    const result = parseDecklists(EMPTY_DECK_FIXTURE, "modern-burn", "https://www.mtggoldfish.com");

    expect(result).toHaveLength(1);
    expect(result[0].needsReview).toBe(true);
    expect(result[0].entries).toEqual([]);
  });
});

describe("fetchArchetypePage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("retries on failure then succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({ ok: false, status: 503 })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => "<html>success</html>",
        })
    );

    const promise = fetchArchetypePage("modern-burn");
    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(2000);

    const result = await promise;

    expect(result).toBe("<html>success</html>");
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("throws immediately on 404 (non-retryable)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({ ok: false, status: 404 })
    );

    await expect(fetchArchetypePage("modern-burn")).rejects.toThrow("non-retryable");
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe("scrapeDecklists", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns needsReview entry on 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({ ok: false, status: 404 })
    );

    const result = await scrapeDecklists({ name: "Burn", slug: "modern-burn" });

    expect(result).toHaveLength(1);
    expect(result[0].needsReview).toBe(true);
    expect(result[0].entries).toEqual([]);
    expect(result[0].sourceUrl).toContain("modern-burn");
  });

  it("returns parsed decklists from fetched HTML", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => FIXTURE_HTML,
      })
    );

    const promise = scrapeDecklists({ name: "Burn", slug: "modern-burn" });
    // Advance past the rate limiting delay
    await vi.advanceTimersByTimeAsync(1000);

    const result = await promise;

    expect(result).toHaveLength(1);
    expect(result[0].needsReview).toBe(false);
    expect(result[0].entries.length).toBeGreaterThan(0);
  });
});
