import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../route";

vi.mock("@/lib/cards/importer", () => ({
  importCards: vi.fn(),
}));

function makeRequest(headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/scraper/cards", {
    headers,
  });
}

describe("GET /api/scraper/cards", () => {
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
    const { importCards } = await import("@/lib/cards/importer");
    vi.mocked(importCards).mockResolvedValue({
      imported: 15000,
      errors: 0,
      total: 15000,
    });

    const response = await GET(
      makeRequest({ authorization: "Bearer test-secret-123" })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.imported).toBe(15000);
    expect(body.errors).toBe(0);
    expect(importCards).toHaveBeenCalledOnce();
  });

  it("returns 500 when import throws", async () => {
    const { importCards } = await import("@/lib/cards/importer");
    vi.mocked(importCards).mockRejectedValue(new Error("Network error"));

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
