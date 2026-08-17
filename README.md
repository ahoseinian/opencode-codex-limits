# opencode-codex-limits

OpenCode TUI plugin that shows ChatGPT/Codex usage quota in the sidebar.

## OpenCode 2

Install the beta package, then add it to the global `~/.config/opencode/cli.json` file:

```json
{
  "plugins": ["opencode-codex-limits@beta"]
}
```

For local development, use the absolute path to this package instead of the npm specifier. OpenCode 2 resolves relative paths from `cli.json`, not from the current project.

OpenCode 2 is currently in beta, so this package's beta releases target a specific OpenCode 2 beta. The current release targets `opencode2 v0.0.0-beta-17519`.

## OpenCode 1

OpenCode 1 requires the `0.1.x` compatibility line. Install `opencode-codex-limits@0.1.7`, then add it to `.opencode/tui.json`:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": ["opencode-codex-limits@0.1.7"]
}
```

Do not add this plugin to `opencode.json`; it is a terminal client plugin, not a server plugin.

The plugin reads the shared OpenCode auth file created by `opencode2 auth login` or `opencode auth login` and displays remaining quota for the available usage windows.

Set `OPENCODE_AUTH_PATH` to point at a specific auth file when testing or using a non-standard OpenCode data directory.

## Development

```bash
bun install
bun run typecheck
bun run test
bun run lint
bun run format:check
bun run build
```

## License

MIT
