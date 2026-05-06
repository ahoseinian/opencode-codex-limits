# opencode-codex-limits

OpenCode TUI plugin that shows ChatGPT/Codex usage quota in the sidebar.

## Usage

Install the package with your preferred JavaScript package manager, then add the TUI plugin export to your OpenCode plugin configuration:

```json
{
  "plugin": ["opencode-codex-limits/tui"]
}
```

The plugin reads the OpenCode auth file created by `opencode auth login` and displays remaining quota for the available usage windows.

## Development

```bash
bun install
bun run typecheck
bun run test
bun run lint
bun run build
```

## License

MIT
