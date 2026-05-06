/** @jsxImportSource @opentui/solid */
import type { TuiPlugin, TuiPluginModule } from "@opencode-ai/plugin/tui";
import { createSignal, For, onMount, Show } from "solid-js";
import { readAuth } from "./src/auth";
import type { QuotaWindow } from "./src/types";

const id = "opencode-codex-limits";

const placeholderWindows: QuotaWindow[] = [
  {
    label: "5h",
    usedPercent: 42,
    resetText: "3h 18m",
  },
  {
    label: "weekly",
    usedPercent: 17,
    resetText: "4d 6h",
  },
];

function statusFor(windows: QuotaWindow[]) {
  const highestUsage = Math.max(...windows.map((window) => window.usedPercent));
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
      return "No auth file found. Run 'opencode auth login' to connect.";
    case "no_openai_auth":
      return "No OpenAI auth found. Run 'opencode auth login' and select ChatGPT Plus/Pro.";
    case "no_access_token":
      return "OpenAI access token is missing. Re-authenticate with 'opencode auth login'.";
    case "token_expired":
      return "OpenAI token has expired. Re-authenticate to refresh.";
    case "invalid_token":
      return "Invalid OpenAI token. Re-authenticate to fix.";
    default:
      return error;
  }
}

function CodexLimitsPanel(props: { theme: () => any }) {
  const [authStatus, setAuthStatus] = createSignal<{
    tag: "loading" | "connected" | "error";
    email?: string;
    error?: string;
  }>({ tag: "loading" });

  onMount(() => {
    const result = readAuth();
    if (result.ok) {
      setAuthStatus({ tag: "connected", email: result.email });
    } else {
      setAuthStatus({ tag: "error", error: result.error });
    }
  });

  const status = () => statusFor(placeholderWindows);
  const statusColor = () => props.theme()[status().colorName];

  return (
    <box flexDirection="column" gap={1}>
      <text fg={statusColor()}>
        <b>Codex Limits [{status().label}]</b>
      </text>

      <Show when={authStatus().tag === "loading"}>
        <text fg={props.theme().textMuted}>checking auth...</text>
      </Show>

      <Show when={authStatus().tag === "error"}>
        <text fg={props.theme().error}>{authErrorMessage(authStatus().error!)}</text>
      </Show>

      <Show when={authStatus().tag === "connected"}>
        <text fg={props.theme().textMuted}>{authStatus().email}</text>
      </Show>

      <For each={placeholderWindows}>
        {(window) => (
          <box flexDirection="column" gap={0}>
            <text fg={props.theme().text}>
              {window.label.padEnd(6, " ")} {progressBar(window.usedPercent)} {window.usedPercent}%
            </text>
            <text fg={props.theme().textMuted}>resets in {window.resetText}</text>
          </box>
        )}
      </For>

      <Show when={authStatus().tag !== "connected"}>
        <text fg={props.theme().textMuted}>quota unavailable until connected</text>
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
