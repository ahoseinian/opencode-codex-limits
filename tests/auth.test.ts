import { describe, expect, test } from "bun:test";
import { parseAuthJson } from "../src/auth";

const VALID_JWT =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwczovL2FwaS5vcGVuYWkuY29tL2F1dGgiOnsiY2hhdGdwdF9hY2NvdW50X2lkIjoidGVzdC1hY2NvdW50LWlkIn0sImh0dHBzOi8vYXBpLm9wZW5haS5jb20vcHJvZmlsZSI6eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20ifX0.abc123";

function authJson(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    openai: {
      type: "oauth",
      access: VALID_JWT,
      expires: Math.floor(Date.now() / 1000) + 3600,
      ...overrides,
    },
  });
}

describe("parseAuthJson", () => {
  test("returns valid auth for correct openai entry", () => {
    const result = parseAuthJson(authJson());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.token).toBe(VALID_JWT);
      expect(result.accountId).toBe("test-account-id");
      expect(result.email).toBe("test@example.com");
    }
  });

  test("skips non-oauth type entries", () => {
    const json = JSON.stringify({
      openai: { type: "api_key", access: VALID_JWT },
    });
    const result = parseAuthJson(json);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("no_openai_auth");
  });

  test("skips empty access token", () => {
    const json = JSON.stringify({
      openai: { type: "oauth", access: "" },
    });
    const result = parseAuthJson(json);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("no_openai_auth");
  });

  test("skips whitespace-only access token", () => {
    const json = JSON.stringify({
      openai: { type: "oauth", access: "   " },
    });
    const result = parseAuthJson(json);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("no_openai_auth");
  });

  test("returns token_expired when expires is in the past", () => {
    const json = authJson({ expires: 1 });
    const result = parseAuthJson(json);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("token_expired");
  });

  test("tolerates missing expires field", () => {
    const json = JSON.stringify({
      openai: { type: "oauth", access: VALID_JWT },
    });
    const result = parseAuthJson(json);
    expect(result.ok).toBe(true);
  });

  test("tolerates missing type field", () => {
    const json = JSON.stringify({
      openai: { access: VALID_JWT },
    });
    const result = parseAuthJson(json);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.email).toBe("test@example.com");
  });

  test("returns no_openai_auth for empty JSON object", () => {
    const result = parseAuthJson("{}");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("no_openai_auth");
  });

  test("ignores non-openai keys in auth file", () => {
    const json = JSON.stringify({
      codex: { type: "oauth", access: VALID_JWT },
    });
    const result = parseAuthJson(json);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("no_openai_auth");
  });

  test("returns auth_file_missing for invalid JSON", () => {
    const result = parseAuthJson("not valid json");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("auth_file_missing");
  });

  test("skips entries with invalid JWT", () => {
    const json = JSON.stringify({
      openai: { type: "oauth", access: "not.a.jwt" },
    });
    const result = parseAuthJson(json);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("no_openai_auth");
  });

  test("skips entries with JWT missing claims", () => {
    const header = "eyJhbGciOiJSUzI1NiJ9";
    const payload = Buffer.from(JSON.stringify({ sub: "no-claims" })).toString("base64url");
    const jwt = `${header}.${payload}.sig`;
    const json = JSON.stringify({
      openai: { type: "oauth", access: jwt },
    });
    const result = parseAuthJson(json);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("no_openai_auth");
  });
});
