# pinned-api-rule (DSH plugin)

Re-injects the MCP/write rule every Nth step, because DSH loads `AGENTS.md` once
per session and only refreshes it when the file's digest changes — on a long
session the rule can compact away.

Modelled on the shipped `@deepseek-ai/dsh-time-context` plugin: an
`agent/pre-step` listener appends one sourced user message to the entering
batch. `EVERY_STEPS` and `TEXT` are constants in `index.js`.

## Configuration

`~/.dsh/pinned-api-rule.json`, re-read on every step — no restart needed to change it:

```json
{ "text": "the reminder text", "everySteps": 3 }
```

A missing file falls back to the built-in defaults. An invalid file keeps the
defaults and injects the parse error instead of the reminder.

## Status: installed as a bundle (2026-10-17)

Installed through the DSH Plugins page from `deepseek-ai-dsh-pinned-api-rule-0.0.3.tgz`.
The package is a bundle: `dsh.bundle.patch` points at `cordis.patch.yml`, which
inserts the plugin row. `@deepseek-ai/dsh-llm@0.2.1-rc.2` is a declared
dependency.

A native config page needs a client half (browser plugin). Deferred: the shared
form primitives are a virtual module the app serves, so it can't be validated
without repeated restarts.
