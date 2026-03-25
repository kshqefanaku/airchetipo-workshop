import { NextResponse } from "next/server";
import { getMetaAnalysis } from "@/lib/services/meta-analysis";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getMetaAnalysis();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch meta analysis:", error);
    return NextResponse.json(
      { error: "Failed to fetch meta analysis" },
      { status: 500 }
    );
  }
}
