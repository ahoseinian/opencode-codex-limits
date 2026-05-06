import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { AuthResult } from "./types";

function authPaths(): string[] {
  if (process.env.OPENCODE_AUTH_PATH) return [process.env.OPENCODE_AUTH_PATH];

  const paths: string[] = [];
  const home = os.homedir();

  paths.push(path.join(home, ".local", "share", "opencode", "auth.json"));

  if (os.platform() === "darwin") {
    paths.push(path.join(home, "Library", "Application Support", "opencode", "auth.json"));
  } else if (os.platform() === "linux") {
    const xdg = process.env.XDG_DATA_HOME || path.join(home, ".local", "share");
    paths.push(path.join(xdg, "opencode", "auth.json"));
  } else if (os.platform() === "win32") {
    paths.push(
      path.join(
        process.env.LOCALAPPDATA || path.join(home, "AppData", "Local"),
        "opencode",
        "auth.json",
      ),
    );
  }

  return paths;
}

function decodeBase64Url(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = (4 - (normalized.length % 4)) % 4;
  return Buffer.from(normalized + "=".repeat(pad), "base64").toString("utf8");
}

type JwtClaims = {
  "https://api.openai.com/auth"?: { chatgpt_account_id?: string };
  "https://api.openai.com/profile"?: { email?: string };
};

function parseJwt(token: string): { accountId: string; email: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(decodeBase64Url(parts[1])) as JwtClaims;
    const accountId = payload["https://api.openai.com/auth"]?.chatgpt_account_id;
    const email = payload["https://api.openai.com/profile"]?.email;
    if (!accountId || !email) return null;
    return { accountId, email };
  } catch {
    return null;
  }
}

type AuthEntry = {
  type?: string;
  access?: string;
  expires?: number;
};

const PROVIDER_KEYS = ["openai"] as const;

export function parseAuthJson(raw: string): AuthResult {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, error: "invalid_auth_file" };
  }

  for (const key of PROVIDER_KEYS) {
    const entry = data[key] as AuthEntry | undefined;
    if (!entry) continue;

    if (entry.type !== undefined && entry.type !== "oauth") continue;

    const access = entry.access;
    if (!access || access.trim() === "") continue;

    if (typeof entry.expires === "number" && entry.expires < Math.floor(Date.now() / 1000)) {
      return { ok: false, error: "token_expired" };
    }

    const jwt = parseJwt(access);
    if (!jwt) continue;

    return { ok: true, token: access, accountId: jwt.accountId, email: jwt.email };
  }

  return { ok: false, error: "no_openai_auth" };
}

export function readAuth(): AuthResult {
  const paths = authPaths();

  let raw: string | null = null;
  for (const p of paths) {
    try {
      raw = readFileSync(p, "utf8");
      break;
    } catch {
      continue;
    }
  }

  if (!raw) return { ok: false, error: "auth_file_missing" };

  return parseAuthJson(raw);
}
