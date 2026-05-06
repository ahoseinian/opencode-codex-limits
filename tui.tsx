/** @jsxImportSource @opentui/solid */
import type { TuiPlugin, TuiPluginModule } from "@opencode-ai/plugin/tui";
import { createResource, createSignal, For, onMount, Show } from "solid-js";
import { readAuth } from "./src/auth";
import { fetchUsage } from "./src/usage";
import type { QuotaState, QuotaWindow } from "./src/types";

const id = "opencode-codex-limits";

function statusFor(windows: QuotaWindow[]) {
  const highestUsage = Math.max(...windows.map((w) => w.usedPercent));
  if (highestUsage >= 95) return { label: "CRIT", colorName: "error" as const };
  if (highestUsage >= 80) return { label: "WARN", colorName: "warning" as const };
  return { label: "OK", colorName: "success" as const };
}

function progressBar(percent: number) {
  const width = 10;
  const filled = Math.max(0, Math.min(width, Math.round((percent / 100) * width)));
  return `${"█".repeat(filled)}${"░".repeat(width - filled)}`;
}

function authErrorMessage(error: string): string {
  switch (error) {
    case "auth_file_missing":
      return "No auth file. Run 'opencode auth login'.";
    case "no_openai_auth":
      return "No OpenAI auth. Run 'opencode auth login' with ChatGPT Plus/Pro.";
    case "no_access_token":
      return "Missing access token. Re-authenticate.";
    case "token_expired":
      return "Token expired. Re-authenticate.";
    case "invalid_token":
      return "Invalid token. Re-authenticate.";
    default:
      return error;
  }
}

function usageErrorMessage(error: string): string {
  switch (error) {
    case "network":
      return "Network error. Check connection.";
    case "auth":
      return "Auth rejected. Token may be expired.";
    case "rate_limited":
      return "API rate limited. Retrying soon.";
    case "invalid_response":
      return "Unexpected API response.";
    case "server_error":
      return "OpenAI server error. Retrying soon.";
    default:
      return error;
  }
}

async function loadQuota(): Promise<QuotaState> {
  const auth = readAuth();
  if (!auth.ok) return { tag: "error", message: authErrorMessage(auth.error) };

  const usage = await fetchUsage(auth.token, auth.accountId);
  if (!usage.ok) return { tag: "error", message: usageErrorMessage(usage.error) };

  return { tag: "data", plan: usage.plan, windows: usage.windows };
}

function CodexLimitsPanel(props: { theme: () => any }) {
  const [quota, { refetch: _refetch }] = createResource(loadQuota);
  const [email, setEmail] = createSignal<string | null>(null);

  onMount(() => {
    const auth = readAuth();
    if (auth.ok) setEmail(auth.email);
  });

  const status = () => {
    const data = quota();
    if (!data || data.tag !== "data") return { label: "--", colorName: "textMuted" as const };
    return statusFor(data.windows);
  };
  const statusColor = () => props.theme()[status().colorName];

  return (
    <box flexDirection="column" gap={1}>
      <text fg={statusColor()}>
        <b>Codex Limits [{status().label}]</b>
      </text>

      <Show when={email()}>
        <text fg={props.theme().textMuted}>{email()}</text>
      </Show>

      <Show when={quota.loading}>
        <text fg={props.theme().textMuted}>loading...</text>
      </Show>

      <Show when={quota.error}>
        <text fg={props.theme().textMuted}>loading...</text>
      </Show>

      <Show when={quota()?.tag === "error"}>
        <text fg={props.theme().error}>
          {(quota() as { tag: "error"; message: string }).message}
        </text>
      </Show>

      <Show when={quota()?.tag === "data"}>
        <For each={(quota() as { tag: "data"; windows: QuotaWindow[] }).windows}>
          {(window) => (
            <box flexDirection="column" gap={0}>
              <text fg={props.theme().text}>
                {window.label.padEnd(6, " ")} {progressBar(window.usedPercent)} {window.usedPercent}
                %
              </text>
              <text fg={props.theme().textMuted}>resets in {window.resetText}</text>
            </box>
          )}
        </For>
      </Show>
    </box>
  );
}

const tui: TuiPlugin = async (api) => {
  api.slots.register({
    order: 160,
    slots: {
      sidebar_content() {
        return <CodexLimitsPanel theme={() => api.theme.current} />;
      },
    },
  });
};

const plugin: TuiPluginModule & { id: string } = {
  id,
  tui,
};

export default plugin;
