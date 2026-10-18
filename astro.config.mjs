import { defineConfig, envField } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
	site: "https://eeshans.com",
	output: "static",
	integrations: [
		mdx(),
		sitemap(),
	],
	env: {
		schema: {
			GITHUB_TOKEN: envField.string({
				access: "secret",
				context: "server",
				optional: true,
			}),
			PUBLIC_POSTHOG_KEY: envField.string({
				access: "public",
				context: "client",
				optional: true,
			}),
			PUBLIC_POSTHOG_HOST: envField.string({
				access: "public",
				context: "client",
				optional: true,
			}),
			PUBLIC_POSTHOG_UI_HOST: envField.string({
				access: "public",
				context: "client",
				optional: true,
			}),
			PUBLIC_ANALYTICS_ALLOWED_HOSTS: envField.string({
				access: "public",
				context: "client",
				optional: true,
			}),
		},
	},
	// Legacy /posts URLs are handled at the host layer (Dockerfile nginx rule).
	// A wildcard here would be baked into the static output as a literal
	// `posts/**/index.html` and never match a real slug.
	vite: {
		plugins: [tailwindcss()],
	},
});