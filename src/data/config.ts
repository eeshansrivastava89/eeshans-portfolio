export const siteConfig = {
	title: "Eeshan Srivastava",
	/** SEO meta tag — used in <meta name="description"> */
	description: "Data science leader, local AI builder, open-source maintainer.",
	/** Homepage hero — headline and the one pitch sentence */
	hero: {
		headline: "Hi, I'm Eeshan.",
		pitch: "I lead data science at Starbucks — and test new AI tools until the hype wears off. Writing about local AI and experimentation, and building open-source tools you can try.",
		/** Search/social description — the pitch is too long for a snippet */
		metaDescription:
			"Eeshan Srivastava leads data science at Starbucks, tests local AI tools, and writes about experimentation, local models, and what survives the hype cycle.",
	},
	/** Homepage display counts — every homepage list and panel reads from here */
	homepage: {
		feedItems: 6,
		projectItems: 6,
		github: {
			weeks: 26,
			repos: 5,
			/** Rows shown per activity category (repositories, issues, pull requests) */
			activity: 3,
		},
	},
	/** Goodreads panel: profile link and shelf sizes */
	goodreads: {
		profileUrl: "https://www.goodreads.com/user/show/7370124",
		handle: "@eeshan",
		currentlyReading: 3,
		recentlyRead: 3,
		toRead: 3,
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
		{ label: "Writing", href: "/writing" },
		{ label: "Blog", href: "/blog" },
		{ label: "Projects", href: "/projects" },
		{ label: "About", href: "/about" },
	],
} as const;