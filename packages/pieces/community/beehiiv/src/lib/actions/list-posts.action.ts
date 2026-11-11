import { Property, createAction } from '@activepieces/pieces-framework';
import { beehiivAuth } from '../common/auth';
import { publicationId } from '../common/props';
import { isNil } from '@activepieces/pieces-framework';
import { apiKeyOf, beehiivClient, pathFor } from '../common/client';
import { aiInput } from '../common/ai-props';
import { beehiivOutputSchemas } from '../common/output-schemas';

export const listPostsAction = createAction({
	auth: beehiivAuth,
	name: 'list_posts',
	classification: 'SEARCH',
	displayName: 'List Posts',
	description:
		'Retrieves posts of a publication, newest first by default. With Limit and Page empty it returns all matching posts (up to 10,000, or 1,000 when content is expanded); otherwise it returns only the requested page with paging info.',
	audience: 'both',
	aiMetadata: {
		description:
			'Lists posts of a beehiiv publication (Publication ID from "List Publications"), filtered by Audience (all, free, premium), Platform (all, web, email, both), Status (all, draft, confirmed = published or scheduled, archived), Content Tags (any tag matches) and Slugs, sorted by Order By and Direction (default created, newest first). Agents should always set Limit (1-100) and Page (1-100): the result is { items, page, limit, total_pages, total_results, has_more }; call again with Page + 1 while has_more is true. With Limit and Page both empty it returns every match in items (fails past 10,000, or past 1,000 when Expand Results includes any content; narrow the filters). Expand Results adds stats or rendered HTML; content can be very large, so in lists request only Stats and use "Get Post" for one post body. Read-only.',
		idempotent: true,
	},
	outputSchema: beehiivOutputSchemas.humanListPosts,
	props: {
		publicationId: publicationId,
		expand: Property.StaticMultiSelectDropdown({
			displayName: 'Expand Results',
			description: 'Optionally expand the results by adding additional information.',
			required: false,
			options: {
				options: [
					{ label: 'Stats', value: 'stats' },
					{ label: 'Free Web Content', value: 'free_web_content' },
					{ label: 'Free Email Content', value: 'free_email_content' },
					{ label: 'Free RSS Content', value: 'free_rss_content' },
					{ label: 'Premium Web Content', value: 'premium_web_content' },
					{ label: 'Premium Email Content', value: 'premium_email_content' },
				],
			},
		}),
		audience: Property.StaticDropdown({
			displayName: 'Audience',
			required: true,
			options: {
				options: [
					{ label: 'All', value: 'all' },
					{ label: 'Free', value: 'free' },
					{ label: 'Premium', value: 'premium' },
				],
			},
		}),
		platform: Property.StaticDropdown({
			displayName: 'Platform',
			required: true,
			options: {
				options: [
					{ label: 'All', value: 'all' },
					{ label: 'Web', value: 'web' },
					{ label: 'Email', value: 'email' },
					{ label: 'Both', value: 'both' },
				],
			},
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			required: true,
			options: {
				options: [
					{ label: 'All', value: 'all' },
					{ label: 'Draft', value: 'draft' },
					{ label: 'Confirmed', value: 'confirmed' },
					{ label: 'Archived', value: 'archived' },
				],
			},
		}),
		content_tags: Property.Array({
			displayName: 'Content Tags',
			description: 'Filter posts by content tags. Returns posts with ANY of the specified tags.',
			required: false,
		}),
		slugs: Property.Array({
			displayName: 'Slugs',
			description: 'Only posts with these URL slugs.',
			required: false,
		}),
		order_by: Property.StaticDropdown<string>({
			displayName: 'Order By',
			description: 'Sort field (default Created).',
			required: false,
			options: {
				options: [
					{ label: 'Created', value: 'created' },
					{ label: 'Publish Date', value: 'publish_date' },
					{ label: 'Displayed Date', value: 'displayed_date' },
				],
			},
		}),
		direction: Property.StaticDropdown<string>({
			displayName: 'Direction',
			description: 'Newest first (default) or oldest first.',
			required: false,
			options: {
				options: [
					{ label: 'Newest first', value: 'desc' },
					{ label: 'Oldest first', value: 'asc' },
				],
			},
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Number of posts to return (1-100, default 10).',
			required: false,
		}),
		page: Property.Number({
			displayName: 'Page',
			description: 'Page number for pagination (default 1).',
			required: false,
		}),
	},
	async run(context) {
		const { publicationId, page, limit, status, platform, audience } = context.propsValue;
		const apiKey = apiKeyOf(context.auth);
		const path = `${pathFor(['publications', publicationId])}/posts`;
		const expand = aiInput.textList({ value: context.propsValue.expand, label: 'Expand Results' });
		const query = {
			audience,
			platform,
			status,
			order_by: aiInput.oneOf({ value: context.propsValue.order_by, label: 'Order By', allowed: ORDER_BY_VALUES }) ?? 'created',
			direction: aiInput.oneOf({ value: context.propsValue.direction, label: 'Direction', allowed: DIRECTION_VALUES }) ?? 'desc',
			'expand[]': expand,
			'content_tags[]': aiInput.textList({ value: context.propsValue.content_tags, label: 'Content Tags' }),
			'slugs[]': aiInput.textList({ value: context.propsValue.slugs, label: 'Slugs' }),
		};

		if (isNil(page) && isNil(limit)) {
			const items = await beehiivClient.listAllPaged<Record<string, unknown>>({
				apiKey,
				path,
				operation: 'list posts',
				query,
				maxItems: expand?.some((field) => field !== 'stats') ? MAX_ITEMS_WITH_CONTENT : MAX_ITEMS,
				retryPending: true,
			});
			return { items, total_results: items.length, has_more: false };
		}

		return beehiivClient.listPage<Record<string, unknown>>({
			apiKey,
			path,
			operation: 'list posts',
			query,
			page: aiInput.integerInRange({ value: page, label: 'Page', min: 1, max: 100, fallback: 1 }),
			limit: aiInput.integerInRange({ value: limit, label: 'Limit', min: 1, max: 100, fallback: DEFAULT_LIMIT }),
			retryPending: true,
		});
	},
});

const MAX_ITEMS = 10_000;

const MAX_ITEMS_WITH_CONTENT = 1_000;

const DEFAULT_LIMIT = 10;

const ORDER_BY_VALUES = ['created', 'publish_date', 'displayed_date'] as const;

const DIRECTION_VALUES = ['asc', 'desc'] as const;
