import type { QuotaResponse, UsageResult, WindowInfo } from "./types";

const USAGE_URL = "https://chatgpt.com/backend-api/wham/usage";
const TIMEOUT_MS = 10_000;

function isWindowInfo(v: unknown): v is WindowInfo {
  if (v === null || v === undefined || typeof v !== "object") return false;
  const w = v as Record<string, unknown>;
  return typeof w.used_percent === "number" && typeof w.reset_after_seconds === "number";
}

function isQuotaResponse(data: unknown): data is QuotaResponse {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;

  if (typeof d.plan_type !== "string") return false;

  const rl = d.rate_limit as Record<string, unknown> | undefined;
  if (!rl) return false;
  if (!isWindowInfo(rl.primary_window)) return false;

  return true;
}

function formatResetTime(seconds: number): string {
  if (seconds <= 0) return "now";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);

  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0 || parts.length === 0) parts.push(`${m}m`);

  return parts.join(" ");
}

export function parseUsageResponse(data: unknown): UsageResult {
  if (!isQuotaResponse(data)) {
    return { ok: false, error: "invalid_response" };
  }

  const windows = [
    {
      label: "5h",
      window: data.rate_limit.primary_window,
    },
    {
      label: "weekly",
      window: data.rate_limit.secondary_window,
    },
  ]
    .filter(({ window: w }) => w !== null && w !== undefined)
    .map(({ label, window: w }) => {
      const window = w as WindowInfo;
      return {
        label,
        usedPercent: Math.min(100, Math.max(0, Math.round(window.used_percent))),
        resetText: formatResetTime(window.reset_after_seconds),
      };
    });

  return { ok: true, plan: data.plan_type, windows };
}

export async function fetchUsage(token: string, accountId: string): Promise<UsageResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(USAGE_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "ChatGPT-Account-Id": accountId,
      },
      signal: controller.signal,
    });

    if (response.status === 401 || response.status === 403) {
      return { ok: false, error: "auth" };
    }
    if (response.status === 429) {
      return { ok: false, error: "rate_limited" };
    }
    if (response.status >= 500) {
      return { ok: false, error: "server_error" };
    }
    if (!response.ok) {
      return { ok: false, error: "server_error" };
    }

    const data: unknown = await response.json();
    return parseUsageResponse(data);
  } catch {
    return { ok: false, error: "network" };
  } finally {
    clearTimeout(timeout);
  }
}
