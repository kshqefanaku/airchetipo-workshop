import { prisma } from "@/lib/prisma";
import { scrapeDecklists } from "./decklist-scraper";
import type { ScrapedDecklist } from "./decklist-scraper";
import { DeckSection } from "@prisma/client";

export interface DecklistImportSummary {
  archetypesProcessed: number;
  decklistsImported: number;
  errors: number;
}

export async function importDecklists(): Promise<DecklistImportSummary> {
  const archetypes = await prisma.archetype.findMany({
    select: { id: true, name: true, slug: true },
  });

  let archetypesProcessed = 0;
  let decklistsImported = 0;
  let errors = 0;

  for (const archetype of archetypes) {
    try {
      const scraped = await scrapeDecklists({ name: archetype.name, slug: archetype.slug });
      const imported = await persistDecklists(archetype.id, scraped);
      decklistsImported += imported;
      archetypesProcessed++;
    } catch (error) {
      console.error(`[decklist-import] Failed to process ${archetype.name}:`, error);
      errors++;
    }
  }

  console.log(
    `[decklist-import] Complete: ${archetypesProcessed} archetypes, ${decklistsImported} decklists, ${errors} errors`
  );

  return { archetypesProcessed, decklistsImported, errors };
}

async function persistDecklists(
  archetypeId: string,
  decklists: ScrapedDecklist[]
): Promise<number> {
  let imported = 0;

  for (const decklist of decklists) {
    try {
      await prisma.$transaction(async (tx) => {
        const upserted = await tx.decklist.upsert({
          where: { sourceUrl: decklist.sourceUrl },
          update: {
            playerName: decklist.playerName,
            eventName: decklist.eventName,
            eventDate: decklist.eventDate ? new Date(decklist.eventDate) : null,
            needsReview: decklist.needsReview,
          },
          create: {
            archetypeId,
            source: "mtggoldfish",
            sourceUrl: decklist.sourceUrl,
            playerName: decklist.playerName,
            eventName: decklist.eventName,
            eventDate: decklist.eventDate ? new Date(decklist.eventDate) : null,
            needsReview: decklist.needsReview,
          },
        });

        // Delete existing entries and recreate for clean update
        await tx.decklistEntry.deleteMany({
          where: { decklistId: upserted.id },
        });

        if (decklist.entries.length > 0) {
          await tx.decklistEntry.createMany({
            data: decklist.entries.map((entry) => ({
              decklistId: upserted.id,
              cardName: entry.cardName,
              quantity: entry.quantity,
              section: entry.section as DeckSection,
            })),
          });
        }
      });

      imported++;
    } catch (error) {
      console.error(`[decklist-import] Failed to persist decklist ${decklist.sourceUrl}:`, error);
    }
  }

  return imported;
}
