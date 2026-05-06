# opencode-codex-limits

OpenCode TUI plugin that shows ChatGPT/Codex usage quota in the sidebar.

## Usage

Install the package with your preferred JavaScript package manager, then add the TUI plugin export to `.opencode/tui.json`:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": ["opencode-codex-limits"]
}
```

For local development in this repository, `.opencode/tui.json` can point at the package root instead:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": [".."]
}
```

Do not add this plugin to `.opencode/opencode.json`; this is a TUI sidebar plugin and belongs in the TUI config.

The plugin reads the OpenCode auth file created by `opencode auth login` and displays remaining quota for the available usage windows.

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
