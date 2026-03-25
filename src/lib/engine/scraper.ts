import * as cheerio from "cheerio";

export interface ScrapedArchetype {
  name: string;
  slug: string;
  metaShare: number;
}

const METAGAME_URL = "https://www.mtggoldfish.com/metagame/modern/full#paper";
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchMetaPage(): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(METAGAME_URL, {
        headers: { "User-Agent": "MTGtester/1.0" },
      });

      if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
        throw new Error(`HTTP ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: non-retryable`);
      }

      return await response.text();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (lastError.message.includes("non-retryable")) {
        throw lastError;
      }

      if (attempt < MAX_RETRIES) {
        const backoffMs = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`[scraper] Attempt ${attempt} failed, retrying in ${backoffMs}ms...`);
        await delay(backoffMs);
      }
    }
  }

  throw lastError ?? new Error("fetchMetaPage failed after retries");
}

export function parseMetaShares(html: string): ScrapedArchetype[] {
  const $ = cheerio.load(html);
  const archetypes: ScrapedArchetype[] = [];

  $(".archetype-tile").each((_, tile) => {
    const $tile = $(tile);

    const nameEl = $tile.find(".archetype-tile-title .deck-price-paper a");
    const name = nameEl.text().trim();
    if (!name) return;

    const href = nameEl.attr("href") ?? "";
    const slug = href.replace(/^\/archetype\//, "").replace(/#.*$/, "");

    const metaText = $tile
      .find(".metagame-percentage .archetype-tile-statistic-value")
      .first()
      .contents()
      .filter(function () {
        return this.type === "text";
      })
      .text()
      .trim();

    const metaShare = parseFloat(metaText);
    if (isNaN(metaShare)) return;

    archetypes.push({ name, slug, metaShare });
  });

  return archetypes;
}

export async function scrapeModernMeta(): Promise<ScrapedArchetype[]> {
  const html = await fetchMetaPage();
  const archetypes = parseMetaShares(html);

  if (archetypes.length === 0) {
    throw new Error("[scraper] No archetypes parsed — possible HTML structure change");
  }

  if (archetypes.length < 5) {
    console.warn(`[scraper] Only ${archetypes.length} archetypes found, expected at least 5`);
  }

  const totalShare = archetypes.reduce((sum, a) => sum + a.metaShare, 0);
  if (Math.abs(totalShare - 100) > 5) {
    console.warn(`[scraper] Meta shares sum to ${totalShare.toFixed(1)}%, expected ~100%`);
  }

  return archetypes;
}
