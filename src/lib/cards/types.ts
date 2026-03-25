export interface ScryfallCard {
  id: string;
  name: string;
  mana_cost?: string;
  cmc: number;
  type_line: string;
  oracle_text?: string;
  colors?: string[];
  set: string;
  rarity: string;
  legalities: Record<string, string>;
  image_uris?: {
    normal?: string;
    small?: string;
    large?: string;
    png?: string;
  };
  card_faces?: Array<{
    name: string;
    mana_cost?: string;
    oracle_text?: string;
    image_uris?: {
      normal?: string;
      small?: string;
    };
  }>;
  layout: string;
}

export interface NormalizedCard {
  scryfallId: string;
  name: string;
  manaCost: string | null;
  cmc: number;
  typeLine: string;
  oracleText: string | null;
  imageUri: string | null;
  colors: string[];
  setCode: string;
  rarity: string;
}
