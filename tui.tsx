/** @jsxImportSource @opentui/solid */
import type { TuiPlugin, TuiPluginModule } from "@opencode-ai/plugin/tui";
import { createResource, For, Show } from "solid-js";
import { readAuth } from "./src/auth";
import { fetchUsage } from "./src/usage";
import type { QuotaState, QuotaWindow } from "./src/types";

const id = "opencode-codex-limits";

function remaining(w: QuotaWindow) {
  return Math.max(0, 100 - w.usedPercent);
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

  return (
    <box flexDirection="column">
      <text>
        <b>Codex Limits</b>
      </text>

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
          {(window) => {
            const remaining_percent = remaining(window);
            const remaining_text = String(remaining_percent).padStart(3, " ") + "%";

            return (
              <text fg={props.theme().text}>
                {remaining_text} {progressBar(remaining_percent)} {window.label} {"\u21bb"}{" "}
                {window.resetText}
              </text>
            );
          }}
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
