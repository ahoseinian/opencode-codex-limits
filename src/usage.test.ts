import { describe, expect, test } from "bun:test";
import { parseUsageResponse } from "./usage";

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
