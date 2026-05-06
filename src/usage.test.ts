import { afterEach, describe, expect, mock, test } from "bun:test";
import { fetchUsage, parseUsageResponse } from "./usage";

function validResponse() {
  return {
    user_id: "user-123",
    account_id: "acc-456",
    email: "test@example.com",
    plan_type: "plus",
    rate_limit: {
      allowed: true,
      limit_reached: false,
      primary_window: {
        used_percent: 51,
        limit_window_seconds: 18000,
        reset_after_seconds: 14780,
        reset_at: 1700000000,
      },
      secondary_window: {
        used_percent: 40,
        limit_window_seconds: 604800,
        reset_after_seconds: 20814,
        reset_at: 1700100000,
      },
    },
    credits: {
      has_credits: false,
      unlimited: false,
      balance: "0",
    },
    spend_control: { reached: false },
  };
}

function mockFetch(handler: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) {
  const fetchMock = mock(handler);
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

describe("parseUsageResponse", () => {
  test("parses valid quota with both windows", () => {
    const result = parseUsageResponse(validResponse());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.plan).toBe("plus");
      expect(result.windows).toHaveLength(2);
      expect(result.windows[0].label).toBe("5h");
      expect(result.windows[0].usedPercent).toBe(51);
      expect(result.windows[1].label).toBe("weekly");
      expect(result.windows[1].usedPercent).toBe(40);
    }
  });

  test("handles primary_window only", () => {
    const data = validResponse();
    (data.rate_limit as Record<string, unknown>).secondary_window = null;
    const result = parseUsageResponse(data);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.windows).toHaveLength(1);
      expect(result.windows[0].label).toBe("5h");
    }
  });

  test("clamps used_percent to 0-100", () => {
    const data = validResponse();
    data.rate_limit.primary_window.used_percent = 150;
    data.rate_limit.secondary_window!.used_percent = -5;
    const result = parseUsageResponse(data);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.windows[0].usedPercent).toBe(100);
      expect(result.windows[1].usedPercent).toBe(0);
    }
  });

  test("returns invalid_response for non-object", () => {
    const result = parseUsageResponse("not an object");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("invalid_response");
  });

  test("returns invalid_response for missing plan_type", () => {
    const data = validResponse();
    delete (data as Record<string, unknown>).plan_type;
    const result = parseUsageResponse(data);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("invalid_response");
  });

  test("returns invalid_response for missing rate_limit", () => {
    const data = validResponse();
    delete (data as Record<string, unknown>).rate_limit;
    const result = parseUsageResponse(data);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("invalid_response");
  });

  test("returns invalid_response for missing primary_window", () => {
    const data = validResponse();
    (data.rate_limit as Record<string, unknown>).primary_window = null;
    const result = parseUsageResponse(data);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("invalid_response");
  });

  test("returns invalid_response for null response", () => {
    const result = parseUsageResponse(null);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("invalid_response");
  });
});

describe("fetchUsage", () => {
  afterEach(() => {
    mock.restore();
  });

  test("sends auth and account headers", async () => {
    const fetchMock = mockFetch(async () => Response.json(validResponse()));

    const result = await fetchUsage("token-123", "account-456");

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://chatgpt.com/backend-api/wham/usage");
    expect(init?.method).toBe("GET");
    expect(init?.headers).toEqual({
      Authorization: "Bearer token-123",
      "ChatGPT-Account-Id": "account-456",
    });
  });

  test("maps auth failures", async () => {
    mockFetch(async () => new Response(null, { status: 401 }));

    const result = await fetchUsage("token", "account");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("auth");
  });

  test("maps rate limits", async () => {
    mockFetch(async () => new Response(null, { status: 429 }));

    const result = await fetchUsage("token", "account");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("rate_limited");
  });

  test("maps server errors", async () => {
    mockFetch(async () => new Response(null, { status: 500 }));

    const result = await fetchUsage("token", "account");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("server_error");
  });

  test("maps invalid successful payloads", async () => {
    mockFetch(async () => Response.json({ unexpected: true }));

    const result = await fetchUsage("token", "account");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("invalid_response");
  });

  test("maps network failures", async () => {
    mockFetch(async () => {
      throw new Error("offline");
    });

    const result = await fetchUsage("token", "account");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("network");
  });
});
