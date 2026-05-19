export const siteConfig = {
	title: "Eeshan Srivastava",
	/** SEO meta tag — used in <meta name="description"> */
	description: "Data science leader, local AI builder, open-source maintainer.",
	/** One-liner shown at the top of the homepage */
	intro: {
		tagline: "I'm passionate about data science, AI, and data privacy. I hope you learn something useful from my projects and writing.",
	},
	url: "https://eeshans.com",
	author: "Eeshan Srivastava",
	socials: [
		{ key: "github", label: "GitHub", href: "https://github.com/eeshansrivastava89" },
		{ key: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/in/eeshans/" },
		{ key: "substack", label: "Asymptotic", href: "https://theasymptotic.substack.com" },
		{ key: "twitter", label: "X", href: "https://x.com/notesundrground" },
	],
	/** Substack subscribe box — displayed at the bottom of pages */
	subscribe: {
		kicker: "The Asymptotic",
		tagline: "Follow me on Substack for posts on AI, data science, and what holds up after the hype.",
		href: "https://theasymptotic.substack.com/subscribe",
	},
	nav: [
		{ label: "Projects", href: "/projects" },
		{ label: "Writing", href: "/writing" },
		{ label: "About", href: "/about" },
	],
	homepageProjectCount: 4,
	homepagePostCount: 3,
} as const;