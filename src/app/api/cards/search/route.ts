import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const cursor = searchParams.get("cursor");

  if (!query || query.trim().length === 0) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 }
    );
  }

  if (query.length > 200) {
    return NextResponse.json(
      { error: "Query too long (max 200 characters)" },
      { status: 400 }
    );
  }

  const cards = await prisma.card.findMany({
    where: {
      name: {
        contains: query,
        mode: "insensitive",
      },
    },
    take: PAGE_SIZE + 1,
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1,
        }
      : {}),
    orderBy: { name: "asc" },
  });

  const hasMore = cards.length > PAGE_SIZE;
  const results = hasMore ? cards.slice(0, PAGE_SIZE) : cards;
  const nextCursor = hasMore ? results[results.length - 1].id : null;

  return NextResponse.json({
    cards: results,
    nextCursor,
  });
}
