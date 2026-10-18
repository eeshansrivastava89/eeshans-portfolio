/**
 * Pinned API rule: re-injects the MCP/write rule every N steps.
 *
 * DSH injects AGENTS.md once per session and only refreshes it when the file
 * changes, so on a long session the rule can compact out of context. This
 * mirrors dsh-time-context: an `agent/pre-step` listener appends one sourced
 * user message to the entering batch, every Nth step.
 */

import { createUserMessage } from "@deepseek-ai/dsh-llm";

export const name = "pinned-api-rule";

const EVERY_STEPS = 3;

const TEXT = [
	"MCP-first reminder: when an MCP server exists for a service, use it.",
	"Read-only API calls are fine.",
	"Any write or destructive API call (REST or GraphQL) needs Eeshan's explicit approval first.",
	"If an MCP refuses an operation, that refusal is the answer — do not route around it.",
].join(" ");

export function apply(ctx) {
	ctx.on("agent/pre-step", async (event, next) => {
		const decision = await next();
		if (decision.kind !== "enter" || event.signal.aborted) return decision;
		if (event.step % EVERY_STEPS !== 0) return decision;

		return {
			...decision,
			messages: [
				...decision.messages,
				createUserMessage({
					content: [{ type: "text", text: TEXT }],
					source: {
						kind: name,
						form: "notice",
						summary: "MCP-first reminder",
					},
				}),
			],
		};
	});
}
