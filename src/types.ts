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

export type QuotaResult =
  | {
      ok: true;
      plan: string;
      windows: QuotaWindow[];
      updatedAt: number;
    }
  | {
      ok: false;
      error: string;
    };

export type QuotaState =
  | { tag: "loading" }
  | { tag: "error"; message: string }
  | { tag: "data"; plan: string; windows: QuotaWindow[] };
