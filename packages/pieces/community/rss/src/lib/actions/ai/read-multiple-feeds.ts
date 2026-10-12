import { createAction, PieceAuth, tryCatch } from '@activepieces/pieces-framework';

import { rssFeedClient } from '../../common/feed-client';
import { feedItemFilters, rssFeedUrls } from '../../common/props';
import { rssReadMultipleFeedsOutputSchema } from '../../output-schemas';

export const rssReadMultipleFeedsAction = createAction({
	auth: PieceAuth.None(),
	name: 'rss_read_multiple_feeds',
	outputSchema: rssReadMultipleFeedsOutputSchema,
	displayName: 'Read Multiple Feeds',
	description: 'Gets the latest items from several feeds as one list, newest first.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Fetches up to 20 RSS, RDF or Atom feeds in parallel and merges their items into one list, newest first, each tagged with the feed it came from; filters by publish date or keyword apply after merging, and the limit applies to the merged list. A feed that fails to load is skipped and listed under failed; the action only errors when every feed fails. Use RSS: Read Feed for a single feed.',
		idempotent: true,
	},
	props: {
		rss_feed_urls: rssFeedUrls,
		...feedItemFilters,
	},
	async run({ propsValue }) {
		const urls = [
			...new Set(
				propsValue.rss_feed_urls
					.filter((url): url is string => typeof url === 'string')
					.map((url) => url.trim())
					.filter((url) => url.length > 0),
			),
		];
		if (urls.length === 0) {
			throw new Error('Provide at least one feed URL.');
		}
		if (urls.length > MAX_FEEDS) {
			throw new Error(`Provide at most ${MAX_FEEDS} feed URLs; got ${urls.length}.`);
		}

		const results = await Promise.all(
			urls.map(async (url) => ({
				url,
				result: await tryCatch(() => rssFeedClient.fetchFeed({ url })),
			})),
		);

		const failed = results.flatMap(({ url, result }) =>
			result.error ? [{ feed_url: url, error: result.error.message }] : [],
		);
		const loaded = results.flatMap(({ url, result }) =>
			result.data ? [{ url, feed: result.data.feed, items: result.data.items }] : [],
		);
		if (loaded.length === 0) {
			throw new Error(
				`None of the feeds could be loaded: ${failed.map((f) => f.error).join('; ')}`,
			);
		}

		const merged = loaded.flatMap(({ url, feed, items }) =>
			items.map((item) => ({ ...item, feed_title: feed.title, feed_url: url })),
		);
		const filtered = rssFeedClient.filterItems({
			items: merged,
			publishedAfter: propsValue.published_after,
			keyword: propsValue.keyword,
			limit: propsValue.limit,
		});

		return {
			items: filtered,
			count: filtered.length,
			feeds: loaded.map(({ url, feed, items }) => ({
				feed_url: url,
				title: feed.title,
				site_url: feed.site_url,
				item_count: items.length,
			})),
			failed,
		};
	},
});

const MAX_FEEDS = 20;
