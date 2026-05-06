import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { AuthResult } from "./types";

function authPath(): string {
  if (process.env.OPENCODE_AUTH_PATH) return process.env.OPENCODE_AUTH_PATH;

  const platform = os.platform();
  if (platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", "opencode", "auth.json");
  }
  if (platform === "linux") {
    const xdg = process.env.XDG_DATA_HOME || path.join(os.homedir(), ".local", "share");
    return path.join(xdg, "opencode", "auth.json");
  }
  if (platform === "win32") {
    return path.join(
      process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"),
      "opencode",
      "auth.json",
    );
  }
  return path.join(os.homedir(), ".local", "share", "opencode", "auth.json");
}

function decodeBase64Url(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = (4 - (normalized.length % 4)) % 4;
  return Buffer.from(normalized + "=".repeat(pad), "base64").toString("utf8");
}

function extractEmailFromJwt(access: string): string {
  try {
    const parts = access.split(".");
    if (parts.length !== 3) return "";
    const payload = JSON.parse(decodeBase64Url(parts[1]));
    return payload?.["https://api.openai.com/profile"]?.email || "";
  } catch {
    return "";
  }
}

export function readAuth(): AuthResult {
  let raw: string;
  try {
    raw = readFileSync(authPath(), "utf8");
  } catch {
    return { ok: false, error: "auth_file_missing" };
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, error: "auth_file_missing" };
  }

  const openai = data.openai as Record<string, unknown> | undefined;
  if (!openai) return { ok: false, error: "no_openai_auth" };

  const access = openai.access;
  if (!access || typeof access !== "string") return { ok: false, error: "no_access_token" };

  const accountId = openai.accountId;
  if (!accountId || typeof accountId !== "string") return { ok: false, error: "no_access_token" };

  const expires = openai.expires;
  if (typeof expires === "number" && Date.now() > expires) {
    return { ok: false, error: "token_expired" };
  }

  const email = extractEmailFromJwt(access);
  if (!email) return { ok: false, error: "invalid_token" };

  return { ok: true, token: access, accountId, email };
}
