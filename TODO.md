# OpenCode Codex Limits Plugin Plan

## Goal

Build a lightweight OpenCode plugin that shows Codex usage limits in the OpenCode sidebar. The plugin should focus only on Codex limits, avoid account switching or request routing, and provide a clear always-visible status panel.

## Product Shape

- Show Codex quota status directly in the OpenCode sidebar.
- Display the main 5-hour/primary limit and weekly/secondary limit.
- Show usage percentage, reset time, and a simple status label.
- Include a manual refresh action and safe background refresh.
- Handle missing auth, expired auth, network failures, and unexpected API responses clearly.
- Keep the first version intentionally small and reliable.

## Technologies And Libraries

- **TypeScript**: Main implementation language for safer plugin code.
- **Bun**: Runtime, package manager, script runner, build tool, and test runner.
- **OpenCode Plugin API**: Plugin integration point for sidebar UI and local behavior.
- **OpenCode TUI Plugin System**: Used for the persistent sidebar panel.
- **SolidJS**: UI library commonly used with OpenCode TUI plugins.
- **@opentui/solid**: TUI component layer for rendering the sidebar panel.
- **Native fetch**: HTTP calls to Codex/OpenAI usage endpoints.
- **bun:test**: Unit tests for auth reading, API parsing, formatting, and error handling.
- **Oxlint**: Fast JavaScript/TypeScript linting, because Bun does not provide a built-in linter.
- **Oxfmt**: Fast JavaScript/TypeScript formatting, because Bun does not provide a built-in formatter.

## Reference Projects

- `PhilippPolterauer/opencode-quotas`: Good reference for quota concepts, status labels, and progress formatting.
- `guyinwonder168/opencode-codex-quota`: Good reference for Codex usage endpoint access and Markdown quota formatting.
- `jasonmit/opencode-codex-usage`: Good reference for lightweight Codex-only quota checks.
- `fitzgpt/opencode-codex-oauth-manager`: Good reference for OpenCode sidebar plugin structure.

## Implementation Todo List

- [x] Confirm the exact OpenCode sidebar plugin entry point and config format.
- [x] Create the initial TypeScript package structure.
- [x] Add Bun-based build, typecheck, test, lint, and format scripts.
- [x] Add Oxlint and Oxfmt configuration.
- [x] Add a minimal sidebar panel that renders static placeholder quota data.
- [x] Locate and read existing Codex/OpenCode auth credentials from the local machine.
- [x] Add clear error messages for missing or invalid auth.
- [ ] Implement a Codex usage client that fetches the current quota snapshot.
- [ ] Normalize API data into a small internal quota model.
- [ ] Render primary/5-hour quota usage in the sidebar.
- [ ] Render secondary/weekly quota usage in the sidebar.
- [ ] Add compact progress bars and status labels.
- [ ] Add reset-time formatting.
- [ ] Add manual refresh support.
- [ ] Add background refresh with a conservative default interval.
- [ ] Show stale data clearly if refresh fails after a previous success.
- [ ] Add tests for successful usage parsing.
- [ ] Add tests for missing auth and expired auth cases.
- [ ] Add tests for network and unexpected-response failures.
- [ ] Add installation instructions for local development.
- [ ] Add final README documentation after the first working version.

## First Version Acceptance Criteria

- The plugin can be installed into OpenCode from this local repository.
- The OpenCode sidebar shows Codex limits without requiring a browser.
- The display includes usage percent and reset time for both key windows when available.
- The plugin does not expose tokens or send credentials anywhere except the required Codex/OpenAI usage endpoint.
- Failures are visible and understandable, not silent.
- Core data parsing and formatting are covered by tests.

## Out Of Scope For Version 1

- Multi-account switching.
- Quota-aware request routing.
- Automatic failover between accounts.
- Desktop notifications.
- Historical charts or long-term analytics.
- Support for non-Codex providers.
