import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchMetaPage, parseMetaShares, scrapeModernMeta } from "../scraper";

const FIXTURE_HTML = `
<html>
<body>
  <div class='archetype-tile' id='25356'>
    <div class='archetype-tile-description-wrapper'>
      <div class='archetype-tile-description'>
        <div class='archetype-tile-title'>
          <span class='deck-price-paper'>
            <a href="/archetype/modern-boros-energy#paper">Boros Energy</a>
          </span>
        </div>
      </div>
      <div class='archetype-tile-statistics'>
        <div class='archetype-tile-statistics-left'>
          <div class='archetype-tile-statistic metagame-percentage'>
            <div class='archetype-tile-statistic-value'>
              20.7%
              <span class='archetype-tile-statistic-value-extra-data'>(478)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class='archetype-tile' id='30100'>
    <div class='archetype-tile-description-wrapper'>
      <div class='archetype-tile-description'>
        <div class='archetype-tile-title'>
          <span class='deck-price-paper'>
            <a href="/archetype/modern-mardu-energy#paper">Mardu Energy</a>
          </span>
        </div>
      </div>
      <div class='archetype-tile-statistics'>
        <div class='archetype-tile-statistics-left'>
          <div class='archetype-tile-statistic metagame-percentage'>
            <div class='archetype-tile-statistic-value'>
              15.3%
              <span class='archetype-tile-statistic-value-extra-data'>(354)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class='archetype-tile' id='12045'>
    <div class='archetype-tile-description-wrapper'>
      <div class='archetype-tile-description'>
        <div class='archetype-tile-title'>
          <span class='deck-price-paper'>
            <a href="/archetype/modern-jeskai-control#paper">Jeskai Control</a>
          </span>
        </div>
      </div>
      <div class='archetype-tile-statistics'>
        <div class='archetype-tile-statistics-left'>
          <div class='archetype-tile-statistic metagame-percentage'>
            <div class='archetype-tile-statistic-value'>
              8.1%
              <span class='archetype-tile-statistic-value-extra-data'>(187)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;

describe("parseMetaShares", () => {
  it("extracts correct names, slugs, and percentages from HTML", () => {
    const result = parseMetaShares(FIXTURE_HTML);

    expect(result).toHaveLength(3);

    expect(result[0]).toEqual({
      name: "Boros Energy",
      slug: "modern-boros-energy",
      metaShare: 20.7,
    });

    expect(result[1]).toEqual({
      name: "Mardu Energy",
      slug: "modern-mardu-energy",
      metaShare: 15.3,
    });

    expect(result[2]).toEqual({
      name: "Jeskai Control",
      slug: "modern-jeskai-control",
      metaShare: 8.1,
    });
  });

  it("returns empty array for unexpected HTML structure", () => {
    const badHtml = `
      <html><body>
        <div class="something-else">
          <p>No archetype tiles here</p>
        </div>
      </body></html>
    `;

    const result = parseMetaShares(badHtml);
    expect(result).toEqual([]);
  });
});

describe("fetchMetaPage", () => {
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

    const promise = fetchMetaPage();
    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(2000);

    const result = await promise;

    expect(result).toBe("<html>success</html>");
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("retries on 429 then throws after max retries", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 429 })
    );

    const promise = fetchMetaPage().catch((e) => e);
    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(2000);

    const error = await promise;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("HTTP 429");
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("throws immediately on non-retryable error (404)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({ ok: false, status: 404 })
    );

    await expect(fetchMetaPage()).rejects.toThrow("non-retryable");
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe("scrapeModernMeta", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("warns when fewer than 5 archetypes are found", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => FIXTURE_HTML,
      })
    );

    const result = await scrapeModernMeta();

    expect(result).toHaveLength(3);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("Only 3 archetypes found")
    );
  });

  it("warns when meta shares do not sum to ~100%", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => FIXTURE_HTML,
      })
    );

    await scrapeModernMeta();

    // 20.7 + 15.3 + 8.1 = 44.1, far from 100
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("Meta shares sum to")
    );
  });
});
