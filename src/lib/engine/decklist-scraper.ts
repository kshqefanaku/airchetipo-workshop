import * as cheerio from "cheerio";

export interface ScrapedDecklistEntry {
  cardName: string;
  quantity: number;
  section: "MAIN" | "SIDEBOARD";
}

export interface ScrapedDecklist {
  playerName: string | null;
  eventName: string | null;
  eventDate: string | null;
  sourceUrl: string;
  entries: ScrapedDecklistEntry[];
  needsReview: boolean;
}

const BASE_URL = "https://www.mtggoldfish.com";
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchArchetypePage(slug: string): Promise<string> {
  const url = `${BASE_URL}/archetype/${slug}#paper`;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
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
        console.log(`[decklist-scraper] Attempt ${attempt} failed, retrying in ${backoffMs}ms...`);
        await delay(backoffMs);
      }
    }
  }

  throw lastError ?? new Error("fetchArchetypePage failed after retries");
}

export function parseDecklists(html: string, slug: string, baseUrl: string): ScrapedDecklist[] {
  const $ = cheerio.load(html);
  const decklists: ScrapedDecklist[] = [];

  $(".archetype-decks .deck-list-container").each((index, container) => {
    const $container = $(container);

    try {
      // Extract header metadata
      const $header = $container.prevAll(".deck-header, .archetype-deck-header").first();
      const playerName = $header.find(".deck-player, .player-name, a[href*='/player/']").first().text().trim() || null;
      const eventName = $header.find(".deck-event, .event-name, a[href*='/tournament/']").first().text().trim() || null;

      const dateText = $header.find(".deck-date, .event-date").first().text().trim();
      let eventDate: string | null = null;
      if (dateText) {
        const parsed = new Date(dateText);
        if (!isNaN(parsed.getTime())) {
          eventDate = parsed.toISOString().split("T")[0];
        }
      }

      // Try to find a permalink for this decklist
      const deckLink = $container.find("a[href*='/deck/']").first().attr("href")
        ?? $header.find("a[href*='/deck/']").first().attr("href");
      const sourceUrl = deckLink
        ? (deckLink.startsWith("http") ? deckLink : `${baseUrl}${deckLink}`)
        : `${baseUrl}/archetype/${slug}#paper-${index}`;

      const entries: ScrapedDecklistEntry[] = [];
      let currentSection: "MAIN" | "SIDEBOARD" = "MAIN";

      $container.find("table.deck-table tr, .deck-list tr").each((_, row) => {
        const $row = $(row);

        // Check for sideboard header
        const headerText = $row.find("td.deck-header, th").text().trim().toLowerCase();
        if (headerText.includes("sideboard")) {
          currentSection = "SIDEBOARD";
          return;
        }

        const quantityText = $row.find("td.deck-col-qty, td:first-child").first().text().trim();
        const cardName = $row.find("td.deck-col-card a, td:nth-child(2) a").first().text().trim();

        if (!cardName) return;

        const quantity = parseInt(quantityText, 10);
        if (isNaN(quantity) || quantity <= 0) return;

        entries.push({ cardName, quantity, section: currentSection });
      });

      if (entries.length === 0) {
        decklists.push({
          playerName,
          eventName,
          eventDate,
          sourceUrl,
          entries: [],
          needsReview: true,
        });
      } else {
        decklists.push({
          playerName,
          eventName,
          eventDate,
          sourceUrl,
          entries,
          needsReview: false,
        });
      }
    } catch {
      decklists.push({
        playerName: null,
        eventName: null,
        eventDate: null,
        sourceUrl: `${baseUrl}/archetype/${slug}#paper`,
        entries: [],
        needsReview: true,
      });
    }
  });

  return decklists;
}

export async function scrapeDecklists(
  archetype: { name: string; slug: string }
): Promise<ScrapedDecklist[]> {
  console.log(`[decklist-scraper] Scraping decklists for ${archetype.name} (${archetype.slug})`);

  let html: string;
  try {
    html = await fetchArchetypePage(archetype.slug);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes("404")) {
      console.log(`[decklist-scraper] 404 for archetype ${archetype.slug}`);
      return [
        {
          playerName: null,
          eventName: null,
          eventDate: null,
          sourceUrl: `${BASE_URL}/archetype/${archetype.slug}#paper`,
          entries: [],
          needsReview: true,
        },
      ];
    }

    throw error;
  }

  // Rate limiting delay
  await delay(1000);

  const decklists = parseDecklists(html, archetype.slug, BASE_URL);

  if (decklists.length === 0) {
    console.log(`[decklist-scraper] No decklists parsed for ${archetype.slug} — possible HTML structure change`);
    return [
      {
        playerName: null,
        eventName: null,
        eventDate: null,
        sourceUrl: `${BASE_URL}/archetype/${archetype.slug}#paper`,
        entries: [],
        needsReview: true,
      },
    ];
  }

  console.log(`[decklist-scraper] Parsed ${decklists.length} decklists for ${archetype.name}`);
  return decklists;
}
