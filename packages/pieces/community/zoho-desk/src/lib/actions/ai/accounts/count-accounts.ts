import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskCountAccountsOutputSchema } from '../../../output-schemas';

export const zohoDeskCountAccountsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_count_accounts',
	outputSchema: zohoDeskCountAccountsOutputSchema,
	displayName: 'Count Accounts',
	description: 'Counts the accounts in a view.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Returns the number of accounts in one account view (from List Views, module accounts).',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		viewId: Property.ShortText({
			displayName: 'View ID',
			description: 'Account view ID (from List Views, module accounts).',
			required: true,
		}),
		startsWith: Property.ShortText({
			displayName: 'Starts With',
			description: 'Only accounts whose name starts with this letter.',
			required: false,
		}),
	},
	async run(context) {
		const { orgId, viewId, startsWith } = context.propsValue;
		return await zohoDeskApi.countAccounts({ auth: context.auth, orgId, viewId, startsWith });
	},
});
