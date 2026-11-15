import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskGetArticleOutputSchema } from '../../../output-schemas';

export const zohoDeskGetArticleAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_article',
	outputSchema: zohoDeskGetArticleOutputSchema,
	displayName: 'Get Article',
	description: 'Gets a knowledge-base article with its content.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one knowledge-base article by ID (from Search Articles or Get Suggested Articles), including its full answer content, status, tags and public URL.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		articleId: Property.ShortText({
			displayName: 'Article ID',
			description: 'Article ID (from Search Articles).',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, articleId } = context.propsValue;
		return await zohoDeskApi.getArticle({ auth: context.auth, orgId, articleId });
	},
});
