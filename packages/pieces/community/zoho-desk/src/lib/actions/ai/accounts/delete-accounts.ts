import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskDeleteAccountsOutputSchema } from '../../../output-schemas';

export const zohoDeskDeleteAccountsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_delete_accounts',
	outputSchema: zohoDeskDeleteAccountsOutputSchema,
	displayName: 'Delete Accounts',
	description: 'Moves accounts to the recycle bin.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Moves one or more accounts to the recycle bin, where an admin can restore them. Needs the Desk.contacts.DELETE scope.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		accountIds: Property.Array({
			displayName: 'Account IDs',
			description: 'Account IDs to delete.',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, accountIds } = context.propsValue;
		await zohoDeskApi.deleteAccounts({
			auth: context.auth,
			orgId,
			accountIds: zohoDeskUtils.requiredStringList({ value: accountIds, propName: 'Account IDs' }),
		});
		return { success: true, accountIds };
	},
});
