import { MarkdownVariant, Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { beehiivAuth } from '../common/auth';
import { publicationId } from '../common/props';
import { isNil } from '@activepieces/pieces-framework';
import { beehiivApiCall, BeehiivPaginatedApiCall } from '../common/client';

export const listPostsAction = createAction({
	auth: beehiivAuth,
	name: 'list_posts',
	classification: 'SEARCH',
	displayName: 'List Posts',
	description: 'Retrieves all posts belonging to a specific publication.',
	audience: 'both',
	aiMetadata: { description: 'Lists posts for a beehiiv publication, filterable by audience (free/premium), platform (web/email), status (draft/confirmed/archived), and content tags, with optional expanded fields like stats or content. When neither page nor limit is set it auto-paginates and returns all matching posts; otherwise it returns the requested page. Use to find or enumerate newsletter posts. Read-only and idempotent.', idempotent: true },
	props: {
		publicationId: publicationId,
		expand: Property.StaticMultiSelectDropdown({
			displayName: 'Extra Data',
			description: 'Extra details to return with each post.',
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
			defaultValue: 'all',
			options: {
				options: [
					{ label: 'All', value: 'all' },
					{ label: 'Free', value: 'free' },
					{ label: 'Premium', value: 'premium' },
				],
			},
			width: 'half',
		}),
		platform: Property.StaticDropdown({
			displayName: 'Platform',
			required: true,
			defaultValue: 'all',
			options: {
				options: [
					{ label: 'All', value: 'all' },
					{ label: 'Web', value: 'web' },
					{ label: 'Email', value: 'email' },
					{ label: 'Both', value: 'both' },
				],
			},
			width: 'half',
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			required: true,
			defaultValue: 'all',
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
			description: 'Only return posts with any of these tags.',
			required: false,
		}),
		paging_info: Property.MarkDown({
			value: 'Leave Limit and Page empty to get every post.',
			variant: MarkdownVariant.INFO,
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Posts per page, 1 to 100.',
			required: false,
			width: 'half',
		}),
		page: Property.Number({
			displayName: 'Page',
			description: 'Page number, starting at 1.',
			required: false,
			width: 'half',
		}),
	},
	propertyGroups: [
		{
			key: 'posts',
			display: 'section',
			label: 'Posts',
			icon: 'filter',
			props: ['publicationId', 'audience', 'platform', 'status', 'content_tags'],
		},
		{
			key: 'results',
			display: 'section',
			label: 'Results',
			icon: 'sliders',
			props: ['expand', 'paging_info', 'limit', 'page'],
		},
	],
	async run(context) {
		const { publicationId, page, limit, status, platform, audience } = context.propsValue;
		const expand = context.propsValue.expand ?? [];
		const tags = context.propsValue.content_tags ?? [];

		const queryParams: Record<string, string | string[] | undefined> = {
			audience,
			platform,
			status,
			order_by: 'created',
			direction: 'desc',
		};
		if (expand.length > 0) {
			queryParams['expand'] = (expand as string[]).join(',');
		}

		if (tags.length > 0) {
			queryParams['content_tags'] = tags as string[];
		}

		if (isNil(page) && isNil(limit)) {
			const response = await BeehiivPaginatedApiCall({
				apiKey: context.auth.secret_text,
				method: HttpMethod.GET,
				resourceUri: `/publications/${publicationId}/posts`,
				query: queryParams,
			});

			return response;
		}

		const response = await beehiivApiCall<{ data: Record<string, any>[] }>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/publications/${publicationId}/posts`,
			query: {
				page,
				limit,
				...queryParams,
			},
		});

		return response.data;
	},
});
