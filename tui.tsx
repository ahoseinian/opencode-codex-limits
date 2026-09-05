/** @jsxImportSource @opentui/solid */
import { Plugin } from "@opencode-ai/plugin/tui";
import type { ResolvedTheme } from "@opencode-ai/theme/tui";
import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { CodexLimitsRpc } from "./src/rpc";
import type { QuotaResult, QuotaState, QuotaWindow } from "./src/types";

const id = "opencode-codex-limits";
const REFRESH_MS = 120_000; // 2 minutes

function remaining(w: QuotaWindow) {
  return Math.max(0, 100 - w.usedPercent);
}

function progressBar(percent: number) {
  const width = 10;
  const filled = Math.max(0, Math.min(width, Math.round((percent / 100) * width)));
  return `${"█".repeat(filled)}${"░".repeat(width - filled)}`;
}

function quotaErrorMessage(error: string): string {
  switch (error) {
    case "no_openai_auth":
      return "No OpenAI auth. Run 'opencode2 auth login' with ChatGPT Plus/Pro.";
    case "unsupported_auth":
      return "Codex usage requires ChatGPT Plus/Pro OAuth.";
    case "invalid_token":
      return "OpenAI credential has an unexpected format.";
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

async function loadQuota(fetchQuota: () => Promise<QuotaResult>): Promise<QuotaState> {
  let usage: QuotaResult;
  try {
    usage = await fetchQuota();
  } catch {
    return {
      tag: "error",
      message: "Server plugin unavailable. Add opencode-codex-limits to opencode.json.",
    };
  }
  if (!usage.ok) return { tag: "error", message: quotaErrorMessage(usage.error) };

  return { tag: "data", plan: usage.plan, windows: usage.windows };
}

function CodexLimitsPanel(props: { theme: ResolvedTheme; fetchQuota: () => Promise<QuotaResult> }) {
  const [quota, setQuota] = createSignal<QuotaState>({ tag: "loading" });
  const [stale, setStale] = createSignal(false);
  let interval: ReturnType<typeof setInterval> | null = null;

  const refresh = async () => {
    const result = await loadQuota(props.fetchQuota);
    if (result.tag === "error") {
      const current = quota();
      if (current.tag === "data") {
        setStale(true);
        return;
      }
    } else {
      setStale(false);
    }
    setQuota(result);
  };

  onMount(() => {
    refresh();
    interval = setInterval(refresh, REFRESH_MS);
  });

  onCleanup(() => {
    if (interval) clearInterval(interval);
  });

  return (
    <box flexDirection="column">
      <box flexDirection="row">
        <text>
          <b>Codex Limits</b>
        </text>
        <Show when={stale()}>
          <text fg={props.theme.text.subdued}> (stale)</text>
        </Show>
      </box>

      <Show when={quota().tag === "loading"}>
        <text fg={props.theme.text.subdued}>loading...</text>
      </Show>

      <Show when={quota().tag === "error"}>
        <text fg={props.theme.text.feedback.error.default}>
          {(quota() as { tag: "error"; message: string }).message}
        </text>
      </Show>

      <Show when={quota().tag === "data"}>
        <For each={(quota() as { tag: "data"; windows: QuotaWindow[] }).windows}>
          {(window) => {
            const remaining_percent = remaining(window);
            const remaining_text = String(remaining_percent).padStart(3, " ") + "%";

            return (
              <text fg={props.theme.text.default}>
                {remaining_text} {progressBar(remaining_percent)} {window.label.padEnd(6, " ")}{" "}
                {"\u21bb"} {window.resetText}
              </text>
            );
          }}
        </For>
      </Show>
    </box>
  );
}

const plugin = Plugin.define({
  id,
  setup(ctx) {
    const rpc = ctx.client.rpc(CodexLimitsRpc);
    return ctx.ui.slot({
      append: "sidebar.content",
      render() {
        return (
          <CodexLimitsPanel
            theme={ctx.theme}
            fetchQuota={() => rpc.usage({}) as Promise<QuotaResult>}
          />
        );
      },
    });
  },
});

export default plugin;
