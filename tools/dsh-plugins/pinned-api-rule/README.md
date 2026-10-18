# pinned-api-rule (DSH plugin)

Re-injects the MCP/write rule every Nth step, because DSH loads `AGENTS.md` once
per session and only refreshes it when the file's digest changes — on a long
session the rule can compact away.

Modelled on the shipped `@deepseek-ai/dsh-time-context` plugin: an
`agent/pre-step` listener appends one sourced user message to the entering
batch. `EVERY_STEPS` and `TEXT` are constants in `index.js`.

## Status: installed as a bundle (2026-10-17)

Installed through the DSH Plugins page from `deepseek-ai-dsh-pinned-api-rule-0.0.2.tgz`.
The package is a bundle: `dsh.bundle.patch` points at `cordis.patch.yml`, which
inserts the plugin row. `@deepseek-ai/dsh-llm@0.2.1-rc.2` is a declared
dependency, so pnpm installs it alongside.

Managed from the UI from now on: switch the bundle on/off, or uninstall it from
the Plugins page. To change the text or frequency, edit `index.js`, bump the
version, repack, and reinstall.
