export type AuthResult =
  | {
      ok: true;
      token: string;
      accountId: string;
      email: string;
    }
  | {
      ok: false;
      error: AuthError;
    };

export type AuthError =
  | "auth_file_missing"
  | "no_openai_auth"
  | "no_access_token"
  | "token_expired"
  | "invalid_token";

export type QuotaWindow = {
  label: string;
  usedPercent: number;
  resetText: string;
};

export type UsageResult =
  | {
      ok: true;
      plan: string;
      windows: QuotaWindow[];
    }
  | {
      ok: false;
      error: UsageError;
    };

export type UsageError = "network" | "auth" | "rate_limited" | "invalid_response" | "server_error";

export type QuotaState =
  | { tag: "loading" }
  | { tag: "error"; message: string }
  | { tag: "data"; plan: string; windows: QuotaWindow[] };

// Raw API response types
export type WindowInfo = {
  used_percent: number;
  limit_window_seconds: number;
  reset_after_seconds: number;
  reset_at: number;
};

export type QuotaResponse = {
  user_id: string;
  account_id: string;
  email: string;
  plan_type: string;
  rate_limit: {
    allowed: boolean;
    limit_reached: boolean;
    primary_window: WindowInfo | null;
    secondary_window: WindowInfo | null;
  };
  credits: {
    has_credits: boolean;
    unlimited: boolean;
    balance: string;
  };
  spend_control: { reached: boolean };
};
