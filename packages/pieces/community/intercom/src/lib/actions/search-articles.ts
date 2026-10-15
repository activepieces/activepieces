import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomAuth } from '../auth';
import { intercomRequest } from '../common';
import { requireText } from '../common/lookups';
import { searchArticlesOutputSchema } from '../output-schemas';

export const searchArticlesAction = createAction({
	auth: intercomAuth,
	name: 'search_articles',
	classification: 'SEARCH',
	displayName: 'Search Help Center Articles',
	description: 'Searches Help Center articles for a phrase.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Searches Help Center articles for a phrase and returns matching articles with title, description, body, URL and state. Use to find an answer to send a customer. Searches published articles unless another state is chosen. Read-only.',
		idempotent: true,
	},
	props: {
		phrase: Property.ShortText({ displayName: 'Phrase', required: true }),
		state: Property.StaticDropdown({
			displayName: 'State',
			required: false,
			defaultValue: 'published',
			options: {
				disabled: false,
				options: [
					{ label: 'Published', value: 'published' },
					{ label: 'Draft', value: 'draft' },
					{ label: 'All', value: 'all' },
				],
			},
		}),
		helpCenterId: Property.ShortText({
			displayName: 'Help Center ID',
			description: 'Only needed when the workspace has several Help Centers.',
			required: false,
		}),
	},
	outputSchema: searchArticlesOutputSchema,
	async run(context) {
		const phrase = requireText({ label: 'Phrase', value: context.propsValue.phrase });
		const body = await intercomRequest<{ total_count?: number; data?: { articles?: Array<Record<string, unknown>> } }>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: ['articles', 'search'],
			query: {
				phrase,
				state: context.propsValue.state || 'published',
				help_center_id: context.propsValue.helpCenterId?.trim() || undefined,
			},
			operation: 'search articles',
		});
		const articles = body.data?.articles ?? [];
		return {
			items: articles.map((article) => ({
				id: article['id'],
				title: article['title'] ?? null,
				description: article['description'] ?? null,
				body: article['body'] ?? null,
				url: article['url'] ?? null,
				state: article['state'] ?? null,
				updated_at: article['updated_at'] ?? null,
			})),
			total_count: typeof body.total_count === 'number' ? body.total_count : articles.length,
		};
	},
});
