import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskListArticlesOutputSchema } from '../../../output-schemas';

export const zohoDeskListArticlesAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_articles',
	outputSchema: zohoDeskListArticlesOutputSchema,
	displayName: 'List Articles',
	description: 'Lists knowledge-base articles.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists knowledge-base articles, optionally in one category or with a given status. Use Search Articles to find articles about a topic.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		categoryId: Property.ShortText({
			displayName: 'Category ID',
			description: 'Only articles in this category.',
			required: false,
		}),
		status: Property.Array({
			displayName: 'Status',
			description: 'Statuses to include, e.g. ["Published"].',
			required: false,
		}),
		sortBy: Property.StaticDropdown({
			displayName: 'Sort By',
			description: 'Field to sort by; a leading "-" sorts descending.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'createdTime', value: 'createdTime' },
					{ label: '-createdTime', value: '-createdTime' },
					{ label: 'modifiedTime', value: 'modifiedTime' },
					{ label: '-modifiedTime', value: '-modifiedTime' },
					{ label: 'viewCount', value: 'viewCount' },
					{ label: '-viewCount', value: '-viewCount' },
					{ label: 'likeCount', value: 'likeCount' },
					{ label: '-likeCount', value: '-likeCount' },
				],
			},
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, categoryId, status, sortBy, from, limit } = context.propsValue;
		const articles = await zohoDeskApi.listArticles({
			auth: context.auth,
			orgId,
			categoryId,
			status: zohoDeskUtils.optionalStringList({ value: status, propName: 'Status' }),
			sortBy,
			from,
			limit,
		});
		return { articles, count: articles.length };
	},
});
