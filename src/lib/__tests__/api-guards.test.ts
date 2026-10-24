import { describe, expect, it } from "vitest";
import { consumeRateLimit, readJsonBody } from "@/lib/api-guards";

describe("API request guards", () => {
  it("parses bounded JSON request bodies", async () => {
    const request = new Request("https://mememic.test/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true }),
    });

    await expect(readJsonBody(request, 100)).resolves.toEqual({ ok: true, value: { ok: true } });
  });

  it("rejects JSON bodies over the configured limit", async () => {
    const request = new Request("https://mememic.test/api", {
      method: "POST",
      body: JSON.stringify({ text: "too long" }),
    });

    await expect(readJsonBody(request, 4)).resolves.toEqual({
      ok: false,
      error: "Request body is too large.",
    });
  });

  it("limits requests per action and client address", () => {
    const address = `test-${crypto.randomUUID()}`;
    const request = new Request("https://mememic.test/api", {
      headers: { "x-forwarded-for": address },
    });

    expect(consumeRateLimit(request, "test-action", 1, 60_000).allowed).toBe(true);
    const limited = consumeRateLimit(request, "test-action", 1, 60_000);
    expect(limited.allowed).toBe(false);
    expect(limited.retryAfterSeconds).toBeGreaterThan(0);
  });
});
