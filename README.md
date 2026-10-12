# opencode-codex-limits

OpenCode TUI plugin that shows ChatGPT/Codex usage quota in the sidebar.

## OpenCode 2

Add the package to the global `~/.config/opencode/opencode.json` file:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["opencode-codex-limits@latest"]
}
```

The package includes a server plugin and a TUI plugin. The server plugin securely resolves OpenCode's active OpenAI credential and exposes only quota data to the sidebar. Do not add the package to `cli.json`; a terminal-only plugin cannot access service-managed credentials.

For local development, use the absolute path to this package directory instead of the npm specifier. OpenCode expects configured local plugins to be directories, not paths to individual JavaScript files.

The current code targets OpenCode `v2.0.27` and the matching `@opencode/plugin` SDK. OpenCode provides the plugin SDK and Effect runtime when loading plugins; older `@opencode-ai/plugin` beta SDKs are not compatible with this runtime.

## OpenCode 1

OpenCode 1 requires the `0.1.x` compatibility line. Install `opencode-codex-limits@0.1.7`, then add it to `.opencode/tui.json`:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": ["opencode-codex-limits@0.1.7"]
}
```

Do not add this plugin to `opencode.json`; it is a terminal client plugin, not a server plugin.

The V2 plugin uses OpenCode's active service-managed credential. The V1 compatibility release reads the shared auth file created by `opencode auth login` and displays remaining quota for the available usage windows.

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
