import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListAccountCommentsOutputSchema } from '../../../output-schemas';

export const zohoDeskListAccountCommentsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_account_comments',
	outputSchema: zohoDeskListAccountCommentsOutputSchema,
	displayName: 'List Account Comments',
	description: 'Lists the comments on a account.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Lists the comments on one account (internal notes).',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		accountId: zohoDeskAiProps.accountId({ required: true }),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, accountId, from, limit } = context.propsValue;
		const comments = await zohoDeskApi.listAccountComments({
			auth: context.auth,
			orgId,
			accountId,
			from,
			limit,
		});
		return { comments, count: comments.length };
	},
});
