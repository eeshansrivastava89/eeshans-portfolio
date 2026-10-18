/**
 * Analytics taxonomy — the single place event names and their properties live.
 *
 * Components spread `tracked(...)` onto an element; one delegated listener in
 * `Base.astro` turns the attributes into a PostHog event. `track(...)` is for
 * client-side code that has no element to attach to.
 */

declare global {
	interface Window {
		posthog?: {
			capture: (name: string, props?: Record<string, unknown>, options?: Record<string, unknown>) => void;
		};
	}
}

export type AnalyticsEventName =
	| "content_clicked"
	| "project_clicked"
	| "demo_opened"
	| "subscribe_clicked"
	| "social_clicked"
	| "github_clicked"
	| "goodreads_clicked"
	| "nav_clicked";

export type AnalyticsProps = Record<string, string | number | undefined>;

/**
 * Build the `data-ph-*` attributes for one tagged element.
 * `tracked("content_clicked", { content_type: "blog", slug })`
 */
export function tracked(event: AnalyticsEventName, props: AnalyticsProps = {}): Record<string, string> {
	const attrs: Record<string, string> = { "data-ph-event": event };
	for (const [key, value] of Object.entries(props)) {
		if (value === undefined) continue;
		attrs[`data-ph-${key.replaceAll("_", "-")}`] = String(value);
	}
	return attrs;
}

/** Capture an event from client-side code (no element to tag). */
export function track(event: AnalyticsEventName, props: AnalyticsProps = {}): void {
	window.posthog?.capture(
		event,
		{ ...props, source_path: window.location.pathname },
		{ send_instantly: true },
	);
}
