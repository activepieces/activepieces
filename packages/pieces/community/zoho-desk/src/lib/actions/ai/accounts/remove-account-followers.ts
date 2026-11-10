import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskAddAccountFollowersOutputSchema } from '../../../output-schemas';

export const zohoDeskRemoveAccountFollowersAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_remove_account_followers',
	outputSchema: zohoDeskAddAccountFollowersOutputSchema,
	displayName: 'Remove Account Followers',
	description: 'Removes followers from a account.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Removes agents from the followers of one account.',
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
			description: 'Agent IDs to remove.',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, accountId, followerIds } = context.propsValue;
		await zohoDeskApi.removeAccountFollowers({
			auth: context.auth,
			orgId,
			accountId,
			followerIds: zohoDeskUtils.requiredStringList({ value: followerIds, propName: 'Agent IDs' }),
		});
		return { success: true, accountId, followerIds };
	},
});
