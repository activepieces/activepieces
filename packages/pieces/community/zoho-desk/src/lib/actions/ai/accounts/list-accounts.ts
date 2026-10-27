import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListAccountsOutputSchema } from '../../../output-schemas';

export const zohoDeskListAccountsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_accounts',
	outputSchema: zohoDeskListAccountsOutputSchema,
	displayName: 'List Accounts',
	description: 'Lists accounts.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists accounts (customer companies) in an organization, optionally from a view. Use Search Accounts to find one by name. Page with From and Limit.',
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
			required: false,
		}),
		sortBy: Property.StaticDropdown({
			displayName: 'Sort By',
			description: 'Field to sort by.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'accountName', value: 'accountName' },
					{ label: 'email', value: 'email' },
					{ label: 'phone', value: 'phone' },
					{ label: 'website', value: 'website' },
					{ label: 'createdTime', value: 'createdTime' },
					{ label: 'modifiedTime', value: 'modifiedTime' },
				],
			},
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, viewId, sortBy, from, limit } = context.propsValue;
		const accounts = await zohoDeskApi.listAccounts({
			auth: context.auth,
			orgId,
			viewId,
			sortBy,
			from,
			limit,
		});
		return { accounts, count: accounts.length };
	},
});
