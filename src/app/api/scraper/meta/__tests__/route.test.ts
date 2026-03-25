import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../route";

vi.mock("@/lib/engine/meta-importer", () => ({
  importMeta: vi.fn(),
}));

function makeRequest(headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/scraper/meta", {
    headers,
  });
}

describe("GET /api/scraper/meta", () => {
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
    const { importMeta } = await import("@/lib/engine/meta-importer");
    vi.mocked(importMeta).mockResolvedValue({
      archetypesProcessed: 25,
      snapshotsCreated: 25,
      errors: 0,
    });

    const response = await GET(
      makeRequest({ authorization: "Bearer test-secret-123" })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.archetypesProcessed).toBe(25);
    expect(body.errors).toBe(0);
    expect(importMeta).toHaveBeenCalledOnce();
  });

  it("returns 500 when import throws", async () => {
    const { importMeta } = await import("@/lib/engine/meta-importer");
    vi.mocked(importMeta).mockRejectedValue(new Error("Scraping failed"));

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
