import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskAddAccountFollowersOutputSchema } from '../../../output-schemas';

export const zohoDeskAddAccountFollowersAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_add_account_followers',
	outputSchema: zohoDeskAddAccountFollowersOutputSchema,
	displayName: 'Add Account Followers',
	description: 'Adds agents as followers of a account.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds agents (from List Agents) as followers of one account so they get its updates.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		accountId: zohoDeskAiProps.accountId({ required: true }),
		followerIds: Property.Array({
			displayName: 'Agent IDs',
			description: 'Agent IDs to add as followers.',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, accountId, followerIds } = context.propsValue;
		await zohoDeskApi.addAccountFollowers({
			auth: context.auth,
			orgId,
			accountId,
			followerIds: zohoDeskUtils.requiredStringList({ value: followerIds, propName: 'Agent IDs' }),
		});
		return { success: true, accountId, followerIds };
	},
});
