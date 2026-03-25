import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../route";

vi.mock("@/lib/engine/decklist-importer", () => ({
  importDecklists: vi.fn(),
}));

function makeRequest(headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/scraper/decklists", {
    headers,
  });
}

describe("GET /api/scraper/decklists", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubEnv("CRON_SECRET", "test-secret-123");
  });

  it("returns 401 when no authorization header", async () => {
    const response = await GET(makeRequest());
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 401 when authorization header has wrong secret", async () => {
    const response = await GET(
      makeRequest({ authorization: "Bearer wrong-secret" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 200 and triggers import with correct secret", async () => {
    const { importDecklists } = await import(
      "@/lib/engine/decklist-importer"
    );
    vi.mocked(importDecklists).mockResolvedValue({
      archetypesProcessed: 10,
      decklistsImported: 42,
      errors: 1,
    });

    const response = await GET(
      makeRequest({ authorization: "Bearer test-secret-123" })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.archetypesProcessed).toBe(10);
    expect(body.decklistsImported).toBe(42);
    expect(body.errors).toBe(1);
    expect(importDecklists).toHaveBeenCalledOnce();
  });

  it("returns 500 when import throws", async () => {
    const { importDecklists } = await import(
      "@/lib/engine/decklist-importer"
    );
    vi.mocked(importDecklists).mockRejectedValue(new Error("Network error"));

    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await GET(
      makeRequest({ authorization: "Bearer test-secret-123" })
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Import failed");
  });

  it("returns 401 when CRON_SECRET env is not set", async () => {
    vi.stubEnv("CRON_SECRET", "");

    const response = await GET(
      makeRequest({ authorization: "Bearer anything" })
    );
    expect(response.status).toBe(401);
  });
});
