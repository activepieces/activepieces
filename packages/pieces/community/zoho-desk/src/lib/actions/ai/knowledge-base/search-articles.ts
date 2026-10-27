import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskSearchArticlesOutputSchema } from '../../../output-schemas';

export const zohoDeskSearchArticlesAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_search_articles',
	outputSchema: zohoDeskSearchArticlesOutputSchema,
	displayName: 'Search Articles',
	description: 'Searches knowledge-base articles.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Searches knowledge-base articles by free text (supports a trailing * wildcard), title, category or tag. Use Get Article for the full answer text.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		searchText: Property.ShortText({
			displayName: 'Search Text',
			description: 'Free text matched in titles and content; end with * for a prefix match.',
			required: false,
		}),
		title: Property.ShortText({
			displayName: 'Title',
			description: 'Text to match in the title.',
			required: false,
		}),
		departmentId: zohoDeskAiProps.departmentId({ required: false }),
		categoryId: Property.ShortText({
			displayName: 'Category ID',
			description: 'Only articles in this category.',
			required: false,
		}),
		tag: Property.Array({
			displayName: 'Tags',
			description: 'Only articles with these tags.',
			required: false,
		}),
		sortBy: Property.StaticDropdown({
			displayName: 'Sort By',
			description: 'Sort order.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'relevance', value: 'relevance' },
					{ label: 'modifiedTime', value: 'modifiedTime' },
					{ label: 'createdTime', value: 'createdTime' },
				],
			},
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, searchText, title, departmentId, categoryId, tag, sortBy, from, limit } =
			context.propsValue;
		const articles = await zohoDeskApi.searchArticles({
			auth: context.auth,
			orgId,
			searchText,
			title,
			departmentId,
			categoryId,
			tag: zohoDeskUtils.optionalStringList({ value: tag, propName: 'Tags' }),
			sortBy,
			from,
			limit,
		});
		return { articles, count: articles.length };
	},
});
