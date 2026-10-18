# pinned-api-rule (DSH plugin)

Re-injects the MCP/write rule every Nth step, because DSH loads `AGENTS.md` once
per session and only refreshes it when the file's digest changes — on a long
session the rule can compact away.

Modelled on the shipped `@deepseek-ai/dsh-time-context` plugin: an
`agent/pre-step` listener appends one sourced user message to the entering
batch. `EVERY_STEPS` and `TEXT` are constants in `index.js`.

## Status: installed (2026-10-17)

Installed into `~/.dsh/profiles/desktop/plugins/pinned-api-rule`, with
`@deepseek-ai/dsh-llm@0.2.1-rc.2` (the version bundled in `app.asar`) installed
beside it so the import resolves. The loader entry uses a path specifier:

```yaml
- id: pinned-api-rule
  name: "./plugins/pinned-api-rule/index.js"
```

Note: the profile's `node_modules/@deepseek-ai/*` are dangling `npx` symlinks —
the app resolves its own plugins from `app.asar`, and only a profile-local
plugin needs real packages. Installing the dependency inside the plugin folder
keeps that local and avoids the shared profile tree.

Rollback: restore the profile backup and restart.

```bash
cp ~/.dsh/profiles/desktop/cordis.patch.yml.bak-1792292862 ~/.dsh/profiles/desktop/cordis.patch.yml
```
