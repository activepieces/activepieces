import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskGetAccountOutputSchema } from '../../../output-schemas';

export const zohoDeskMergeAccountsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_merge_accounts',
	outputSchema: zohoDeskGetAccountOutputSchema,
	displayName: 'Merge Accounts',
	description: 'Merges other accounts into one account.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Merges the listed accounts into the target account, moving their contacts and tickets to it; the merged accounts are removed. This cannot be undone.',
		idempotent: false,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		accountId: Property.ShortText({
			displayName: 'Target Account ID',
			description: 'ID of the account the others are merged into.',
			required: true,
		}),
		accountIds: Property.Array({
			displayName: 'Account IDs',
			description: 'IDs of the accounts to merge into the target account.',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, accountId, accountIds } = context.propsValue;
		return await zohoDeskApi.mergeAccounts({
			auth: context.auth,
			orgId,
			accountId,
			accountIds: zohoDeskUtils.requiredStringList({ value: accountIds, propName: 'Account IDs' }),
		});
	},
});
