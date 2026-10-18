# pinned-api-rule (DSH plugin)

Re-injects the MCP/write rule every Nth step, because DSH loads `AGENTS.md` once
per session and only refreshes it when the file's digest changes — on a long
session the rule can compact away.

Modelled on the shipped `@deepseek-ai/dsh-time-context` plugin: an
`agent/pre-step` listener appends one sourced user message to the entering
batch. `EVERY_STEPS` and `TEXT` are constants in `index.js`.

## Status: not installable in the packaged app

The plugin imports `createUserMessage` from `@deepseek-ai/dsh-llm`. In the
installed DeepSeek Harness, the profile's `node_modules/@deepseek-ai/*` are
symlinks into `~/.npm/_npx/1e7f6d9597241db0/…`, and that cache no longer exists,
so a plugin loaded from `~/.dsh/profiles/**` cannot resolve any DSH package:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@deepseek-ai/dsh-llm'
```

The app resolves its own plugins from inside `app.asar`, not from the profile.
So this file is a ready-made plugin that needs a DSH build that can resolve the
package — either a source build that vendors it, or an upstream option for
pinned instructions.

## Alternatives until then

1. Keep `AGENTS.md` small (done) and restate the rule at phase/service boundaries.
2. Ask upstream for a config on `dsh-agent-instructions` — e.g. a pinned line
   re-injected every N steps — instead of a separate plugin.
