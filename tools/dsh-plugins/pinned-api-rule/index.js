/**
 * Pinned API rule: re-injects the MCP/write rule every N steps.
 *
 * DSH injects AGENTS.md once per session and only refreshes it when the file
 * changes, so on a long session the rule can compact out of context. This
 * mirrors dsh-time-context: an `agent/pre-step` listener appends one sourced
 * user message to the entering batch, every Nth step.
 *
 * Config lives in ~/.dsh/pinned-api-rule.json and is re-read every step:
 *
 *   { "text": "...", "everySteps": 3 }
 *
 * A missing file uses the defaults below. An unreadable or invalid file keeps
 * the defaults and surfaces the reason in the injected message.
 */

import { createUserMessage } from "@deepseek-ai/dsh-llm";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const name = "pinned-api-rule";

/** Pre-step lives on the agents service; wait for it before registering. */
export const inject = ["agents"];

const CONFIG_PATH = join(homedir(), ".dsh", "pinned-api-rule.json");

const DEFAULTS = {
	text: [
		"MCP-first reminder: when an MCP server exists for a service, use it.",
		"Read-only API calls are fine.",
		"Any write or destructive API call (REST or GraphQL) needs Eeshan's explicit approval first.",
		"If an MCP refuses an operation, that refusal is the answer — do not route around it.",
	].join(" "),
	everySteps: 3,
};

function positiveInt(value, fallback) {
	return Number.isSafeInteger(value) && value >= 1 ? value : fallback;
}

function loadConfig() {
	try {
		const parsed = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
		const text = typeof parsed.text === "string" && parsed.text.trim() !== "" ? parsed.text.trim() : DEFAULTS.text;
		return { text, everySteps: positiveInt(parsed.everySteps, DEFAULTS.everySteps), notice: null };
	} catch (error) {
		return {
			...DEFAULTS,
			notice: error.code === "ENOENT" ? null : `pinned-api-rule: cannot use ${CONFIG_PATH} — ${error.message}`,
		};
	}
}

export function apply(ctx) {
	ctx.on("agent/pre-step", async (event, next) => {
		const decision = await next();
		if (decision.kind !== "enter" || event.signal.aborted) return decision;

		const config = loadConfig();
		if (event.step % config.everySteps !== 0) return decision;

		return {
			...decision,
			messages: [
				...decision.messages,
				createUserMessage({
					content: [{ type: "text", text: config.notice ?? config.text }],
					source: { kind: name, form: "notice", summary: "MCP-first reminder" },
				}),
			],
		};
	});
}
