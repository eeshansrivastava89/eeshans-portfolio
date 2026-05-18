import { defineConfig } from "astro/config";
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
	vite: {
		plugins: [tailwindcss()],
	},
});