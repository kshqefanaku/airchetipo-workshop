import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 50;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const archetype = searchParams.get("archetype");
  const limitParam = searchParams.get("limit");

  if (!archetype || archetype.trim().length === 0) {
    return NextResponse.json(
      { error: "Query parameter 'archetype' is required" },
      { status: 400 }
    );
  }

  let limit = DEFAULT_LIMIT;
  if (limitParam !== null) {
    const parsed = Number(limitParam);
    if (!Number.isInteger(parsed) || parsed < 1) {
      return NextResponse.json(
        { error: "'limit' must be a valid positive integer" },
        { status: 400 }
      );
    }
    limit = Math.min(parsed, MAX_LIMIT);
  }

  const archetypeRecord = await prisma.archetype.findUnique({
    where: { slug: archetype },
  });

  if (!archetypeRecord) {
    return NextResponse.json({ decklists: [] });
  }

  const decklists = await prisma.decklist.findMany({
    where: { archetypeId: archetypeRecord.id },
    take: limit,
    orderBy: {
      eventDate: { sort: "desc", nulls: "last" },
    },
    select: {
      id: true,
      playerName: true,
      eventName: true,
      eventDate: true,
      sourceUrl: true,
      entries: {
        select: {
          cardName: true,
          quantity: true,
          section: true,
        },
      },
    },
  });

  return NextResponse.json({ decklists });
}
