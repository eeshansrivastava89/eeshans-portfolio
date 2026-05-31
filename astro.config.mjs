import { defineConfig, envField } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import expressiveCode from "astro-expressive-code";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
	site: "https://eeshans.com",
	output: "static",
	integrations: [
		react(),
		expressiveCode(),
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
		},
	},
	redirects: {
		"/posts": "/writing",
		"/posts/**": "/writing",
	},
	vite: {
		plugins: [tailwindcss()],
	},
});