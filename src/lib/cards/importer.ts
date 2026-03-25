import { prisma } from "@/lib/prisma";
import { fetchModernCards } from "./scryfall";
import type { NormalizedCard } from "./types";
import { Prisma } from "@prisma/client";

const BATCH_SIZE = 500;

export interface ImportSummary {
  imported: number;
  errors: number;
  total: number;
}

export async function importCards(): Promise<ImportSummary> {
  const cards = await fetchModernCards();
  let imported = 0;
  let errors = 0;

  for (let i = 0; i < cards.length; i += BATCH_SIZE) {
    const batch = cards.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(cards.length / BATCH_SIZE);

    console.log(`[import] Processing batch ${batchNumber}/${totalBatches} (${batch.length} cards)`);

    try {
      await upsertBatch(batch);
      imported += batch.length;
    } catch (error) {
      console.error(`[import] Batch ${batchNumber} failed:`, error);
      errors += batch.length;
    }
  }

  console.log(`[import] Complete: ${imported} imported, ${errors} errors, ${cards.length} total`);

  return { imported, errors, total: cards.length };
}

async function upsertBatch(cards: NormalizedCard[]): Promise<void> {
  if (cards.length === 0) return;

  const values = cards.map(
    (card) =>
      Prisma.sql`(
        gen_random_uuid(),
        ${card.scryfallId},
        ${card.name},
        ${card.manaCost},
        ${card.cmc},
        ${card.typeLine},
        ${card.oracleText},
        ${card.imageUri},
        ${card.colors},
        ${card.setCode},
        ${card.rarity},
        NOW(),
        NOW()
      )`
  );

  await prisma.$executeRaw`
    INSERT INTO "cards" ("id", "scryfallId", "name", "manaCost", "cmc", "typeLine", "oracleText", "imageUri", "colors", "setCode", "rarity", "createdAt", "updatedAt")
    VALUES ${Prisma.join(values)}
    ON CONFLICT ("scryfallId") DO UPDATE SET
      "name" = EXCLUDED."name",
      "manaCost" = EXCLUDED."manaCost",
      "cmc" = EXCLUDED."cmc",
      "typeLine" = EXCLUDED."typeLine",
      "oracleText" = EXCLUDED."oracleText",
      "imageUri" = EXCLUDED."imageUri",
      "colors" = EXCLUDED."colors",
      "setCode" = EXCLUDED."setCode",
      "rarity" = EXCLUDED."rarity",
      "updatedAt" = NOW()
  `;
}
