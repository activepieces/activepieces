import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { beehiivAuth } from '../common/auth';
import { publicationId } from '../common/props';
import { isNil } from '@activepieces/shared';
import { beehiivApiCall, BeehiivPaginatedApiCall } from '../common/client';

export const listPostsAction = createAction({
	auth: beehiivAuth,
	name: 'list_posts',
	displayName: 'List Posts',
	description: 'Retrieves all posts belonging to a specific publication.',
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
		const expand = context.propsValue.expand ?? [];
		const tags = context.propsValue.content_tags ?? [];

		const queryParams: Record<string, string | string[] | undefined> = {
			audience,
			platform,
			status,
			order_by: 'created',
			direction: 'desc',
		};
		if (expand) {
			queryParams['expand'] = (expand as string[]).join(',');
		}

		if (tags.length > 0) {
			queryParams['content_tags'] = tags as string[];
		}

		if (isNil(page) && isNil(limit)) {
			const response = await BeehiivPaginatedApiCall({
				apiKey: context.auth,
				method: HttpMethod.GET,
				resourceUri: `/publications/${publicationId}/automations`,
				query: queryParams,
			});

			return response;
		}

		const response = await beehiivApiCall<{ data: Record<string, any>[] }>({
			apiKey: context.auth,
			method: HttpMethod.GET,
			resourceUri: `/publications/${publicationId}/automations`,
			query: {
				page,
				limit,
				...queryParams,
			},
		});

		return response.data;
	},
});
