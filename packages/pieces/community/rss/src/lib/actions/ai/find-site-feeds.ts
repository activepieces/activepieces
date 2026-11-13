import { createAction, PieceAuth, Property, tryCatch } from '@activepieces/pieces-framework';

import { rssFeedClient } from '../../common/feed-client';
import { rssFindSiteFeedsOutputSchema } from '../../output-schemas';

export const rssFindSiteFeedsAction = createAction({
	auth: PieceAuth.None(),
	name: 'rss_find_site_feeds',
	outputSchema: rssFindSiteFeedsOutputSchema,
	displayName: 'Find Site Feeds',
	description: 'Finds the RSS and Atom feeds a website publishes.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Loads a web page (a homepage, blog or article URL) and returns the RSS, RDF and Atom feed URLs it advertises in its <link rel="alternate"> tags; if the URL is itself a feed, returns that feed. Use it to get the feed URL that RSS: Read Feed and RSS: Read Multiple Feeds need. Sites that publish a feed without advertising it in the page are not found.',
		idempotent: true,
	},
	props: {
		site_url: Property.ShortText({
			displayName: 'Website URL',
			description: 'A page on the site, such as its homepage or a blog post.',
			placeholder: 'https://example.com',
			required: true,
		}),
	},
	async run({ propsValue }) {
		const url = propsValue.site_url.trim();
		const page = await rssFeedClient.fetchPage({ url });

		if (!page.contentType.includes('html')) {
			const { data } = await tryCatch(() => rssFeedClient.parseFeed({ body: page.body, url }));
			if (data) {
				const feeds = [
					{ url: data.feed.feed_url, title: data.feed.title, format: data.feed.format },
				];
				return { feeds, count: feeds.length };
			}
		}

		const feeds = findAdvertisedFeeds({ html: page.body, baseUrl: url });
		return { feeds, count: feeds.length };
	},
});

function findAdvertisedFeeds({
	html,
	baseUrl,
}: {
	html: string;
	baseUrl: string;
}): AdvertisedFeed[] {
	const page = html.replace(NON_MARKUP, '');
	const baseHref = parseAttributes({ tag: page.match(BASE_TAG)?.[0] ?? '' })['href'];
	const documentBase = (baseHref && resolveUrl({ href: baseHref, baseUrl })) || baseUrl;
	const feeds = (page.match(LINK_TAG) ?? [])
		.map((tag) => parseAttributes({ tag }))
		.filter(
			(attrs) =>
				(attrs['rel'] ?? '').toLowerCase().split(/\s+/).includes('alternate') &&
				FEED_FORMATS[(attrs['type'] ?? '').toLowerCase()] !== undefined &&
				Boolean(attrs['href']),
		)
		.flatMap((attrs) => {
			const resolved = resolveUrl({ href: attrs['href'] ?? '', baseUrl: documentBase });
			return resolved
				? [
						{
							url: resolved,
							title: attrs['title'] || null,
							format: FEED_FORMATS[(attrs['type'] ?? '').toLowerCase()] ?? null,
						},
				  ]
				: [];
		});
	return feeds.filter((feed, index) => feeds.findIndex((f) => f.url === feed.url) === index);
}

function parseAttributes({ tag }: { tag: string }): Record<string, string> {
	return Object.fromEntries(
		[...tag.matchAll(/([a-zA-Z:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g)].map((match) => [
			match[1].toLowerCase(),
			decodeEntities({ text: match[2] ?? match[3] ?? match[4] ?? '' }),
		]),
	);
}

function decodeEntities({ text }: { text: string }): string {
	return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, name: string) => {
		if (name.startsWith('#')) {
			const isHex = name[1] === 'x' || name[1] === 'X';
			const codePoint = Number.parseInt(name.slice(isHex ? 2 : 1), isHex ? 16 : 10);
			return codePoint > 0 && codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : entity;
		}
		return NAMED_ENTITIES[name.toLowerCase()] ?? entity;
	});
}

function resolveUrl({ href, baseUrl }: { href: string; baseUrl: string }): string | null {
	try {
		return new URL(href, baseUrl).toString();
	} catch {
		return null;
	}
}

const NON_MARKUP = /<!--[\s\S]*?-->|<(script|style|template)\b[\s\S]*?<\/\1\s*>/gi;
const LINK_TAG = /<link\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi;
const BASE_TAG = /<base\b(?:[^>"']|"[^"]*"|'[^']*')*>/i;

const NAMED_ENTITIES: Record<string, string | undefined> = {
	amp: '&',
	lt: '<',
	gt: '>',
	quot: '"',
	apos: "'",
	nbsp: ' ',
	raquo: '»',
	laquo: '«',
	ndash: '–',
	mdash: '—',
	hellip: '…',
	rsquo: '’',
	lsquo: '‘',
	rdquo: '”',
	ldquo: '“',
};

const FEED_FORMATS: Record<string, 'rss' | 'atom' | 'rdf' | undefined> = {
	'application/rss+xml': 'rss',
	'application/atom+xml': 'atom',
	'application/rdf+xml': 'rdf',
};

type AdvertisedFeed = {
	url: string;
	title: string | null;
	format: 'rss' | 'atom' | 'rdf' | null;
};
