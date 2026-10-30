import { createAction, PieceAuth } from '@activepieces/pieces-framework';

import { rssFeedClient } from '../../common/feed-client';
import { feedItemFilters, rssFeedUrl } from '../../common/props';
import { rssReadFeedOutputSchema } from '../../output-schemas';

export const rssReadFeedAction = createAction({
	auth: PieceAuth.None(),
	name: 'rss_read_feed',
	outputSchema: rssReadFeedOutputSchema,
	displayName: 'Read Feed',
	description: "Gets a feed's details and its latest items, newest first.",
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Fetches one RSS, RDF or Atom feed by its feed URL and returns the feed details plus its items, newest first, optionally filtered by publish date or keyword. Use RSS: Read Multiple Feeds for several feeds at once, and RSS: Find Site Feeds first when you only have a website or article URL rather than the feed URL. A feed only carries its most recent entries (often 10–50), so older items are not reachable.',
		idempotent: true,
	},
	props: {
		rss_feed_url: rssFeedUrl,
		...feedItemFilters,
	},
	async run({ propsValue }) {
		const { feed, items } = await rssFeedClient.fetchFeed({ url: propsValue.rss_feed_url });
		const filtered = rssFeedClient.filterItems({
			items,
			publishedAfter: propsValue.published_after,
			keyword: propsValue.keyword,
			limit: propsValue.limit,
		});
		return {
			feed,
			items: filtered,
			count: filtered.length,
			total_in_feed: items.length,
		};
	},
});
