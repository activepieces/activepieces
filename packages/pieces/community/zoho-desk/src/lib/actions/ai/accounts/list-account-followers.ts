import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListAccountFollowersOutputSchema } from '../../../output-schemas';

export const zohoDeskListAccountFollowersAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_account_followers',
	outputSchema: zohoDeskListAccountFollowersOutputSchema,
	displayName: 'List Account Followers',
	description: 'Lists the agents following a account.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: { description: 'Lists the agents following one account.', idempotent: true },
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
		const followers = await zohoDeskApi.listAccountFollowers({
			auth: context.auth,
			orgId,
			accountId,
			from,
			limit,
		});
		return { followers, count: followers.length };
	},
});
