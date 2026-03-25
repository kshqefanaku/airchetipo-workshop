import type { ScryfallCard, NormalizedCard } from "./types";

const SEARCH_URL = "https://api.scryfall.com/cards/search";
const SCRYFALL_DELAY_MS = 100; // Scryfall asks for 50-100ms between requests

interface ScryfallSearchResponse {
  data: ScryfallCard[];
  has_more: boolean;
  next_page?: string;
  total_cards: number;
}

function normalizeScryfallCard(card: ScryfallCard): NormalizedCard {
  const isDoubleFaced =
    card.card_faces &&
    card.card_faces.length > 0 &&
    !card.image_uris;

  const frontFace = isDoubleFaced ? card.card_faces![0] : null;

  return {
    scryfallId: card.id,
    name: card.name,
    manaCost: card.mana_cost ?? frontFace?.mana_cost ?? null,
    cmc: card.cmc,
    typeLine: card.type_line,
    oracleText: card.oracle_text ?? frontFace?.oracle_text ?? null,
    imageUri:
      card.image_uris?.normal ??
      frontFace?.image_uris?.normal ??
      null,
    colors: card.colors ?? [],
    setCode: card.set,
    rarity: card.rarity,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchModernCards(): Promise<NormalizedCard[]> {
  const cards: NormalizedCard[] = [];
  let url: string | null = `${SEARCH_URL}?q=legal%3Amodern&unique=cards&order=name`;

  while (url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Scryfall search failed: ${response.status}`);
    }

    const data: ScryfallSearchResponse = await response.json();
    const normalized = data.data.map(normalizeScryfallCard);
    cards.push(...normalized);

    console.log(`[scryfall] Fetched ${cards.length}/${data.total_cards} cards`);

    if (data.has_more && data.next_page) {
      url = data.next_page;
      await delay(SCRYFALL_DELAY_MS);
    } else {
      url = null;
    }
  }

  return cards;
}

// Exported for testing
export { normalizeScryfallCard };
