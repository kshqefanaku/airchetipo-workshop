import { prisma } from "@/lib/prisma";
import { scrapeModernMeta } from "./scraper";
import type { ScrapedArchetype } from "./scraper";

export interface MetaImportSummary {
  archetypesProcessed: number;
  snapshotsCreated: number;
  errors: number;
}

export async function importMeta(): Promise<MetaImportSummary> {
  const archetypes = await scrapeModernMeta();
  let archetypesProcessed = 0;
  let snapshotsCreated = 0;
  let errors = 0;

  for (const entry of archetypes) {
    try {
      await prisma.$transaction(async (tx) => {
        const archetype = await tx.archetype.upsert({
          where: { slug: entry.slug },
          update: { name: entry.name },
          create: {
            name: entry.name,
            slug: entry.slug,
          },
        });

        await tx.metaSnapshot.create({
          data: {
            archetypeId: archetype.id,
            metaShare: entry.metaShare,
            source: "mtggoldfish",
          },
        });
      });

      archetypesProcessed++;
      snapshotsCreated++;
    } catch (error) {
      console.error(`[meta-import] Failed to process ${entry.name}:`, error);
      errors++;
    }
  }

  console.log(
    `[meta-import] Complete: ${archetypesProcessed} archetypes, ${snapshotsCreated} snapshots, ${errors} errors`
  );

  return { archetypesProcessed, snapshotsCreated, errors };
}
