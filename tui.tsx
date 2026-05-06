/** @jsxImportSource @opentui/solid */
import type { TuiPlugin, TuiPluginModule } from "@opencode-ai/plugin/tui";
import { For } from "solid-js";

const id = "opencode-codex-limits";

type QuotaWindow = {
  label: string;
  usedPercent: number;
  resetText: string;
};

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

function CodexLimitsPanel(props: { theme: () => any }) {
  const status = () => statusFor(placeholderWindows);
  const statusColor = () => props.theme()[status().colorName];

  return (
    <box flexDirection="column" gap={1}>
      <text fg={statusColor()}>
        <b>Codex Limits [{status().label}]</b>
      </text>
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
      <text fg={props.theme().textMuted}>static placeholder data</text>
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
