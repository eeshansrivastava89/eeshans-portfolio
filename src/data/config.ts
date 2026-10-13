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
	/** Subscribe CTAs — one entry per feed; consumed by SubscribeBox */
	subscribe: [
		{
			kicker: "The Asymptotic",
			tagline: "Follow me on Substack. I write about local AI, data science, and essays on human-centric approaches to working with technology.",
			href: "https://theasymptotic.substack.com/subscribe",
			feed: "substack",
		},
		{
			kicker: "Eeshan's Blog",
			tagline: "Follow on WordPress for personal essays, book reviews, and drawings going back to 2008.",
			href: "https://eeshan89.wordpress.com",
			feed: "wordpress",
		},
	] as const,
	nav: [
		{ label: "Technical Writing", href: "/writing" },
		{ label: "Personal Blog", href: "/blog" },
		{ label: "Projects", href: "/projects" },
		{ label: "About", href: "/about" },
	],
} as const;