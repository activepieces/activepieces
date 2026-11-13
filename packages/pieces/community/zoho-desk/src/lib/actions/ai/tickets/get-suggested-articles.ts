import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskSearchArticlesOutputSchema } from '../../../output-schemas';

export const zohoDeskGetSuggestedArticlesAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_suggested_articles',
	outputSchema: zohoDeskSearchArticlesOutputSchema,
	displayName: 'Get Suggested Articles',
	description: 'Gets knowledge-base articles suggested for a ticket.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			"Gets knowledge-base articles Zoho suggests for one ticket, based on its content. Use Get Article for an article's full text and Link Articles To Ticket to record that one was used.",
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketId: zohoDeskAiProps.ticketId({ required: true }),
		departmentId: zohoDeskAiProps.departmentId({
			required: false,
			description: 'Department whose knowledge base to search (from List Departments).',
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, ticketId, departmentId, from, limit } = context.propsValue;
		const articles = await zohoDeskApi.getSuggestedArticles({
			auth: context.auth,
			orgId,
			ticketId,
			departmentId,
			from,
			limit,
		});
		return { articles, count: articles.length };
	},
});
