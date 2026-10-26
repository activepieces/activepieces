import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListContactAccountsOutputSchema } from '../../../output-schemas';

export const zohoDeskListContactAccountsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_contact_accounts',
	outputSchema: zohoDeskListContactAccountsOutputSchema,
	displayName: 'List Contact Accounts',
	description: 'Lists the accounts a contact belongs to.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: { description: 'Lists the accounts linked to one contact.', idempotent: true },
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		contactId: zohoDeskAiProps.contactId({ required: true }),
		sortBy: Property.StaticDropdown({
			displayName: 'Sort By',
			description: 'Field to sort by.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'accountName', value: 'accountName' },
					{ label: 'createdTime', value: 'createdTime' },
					{ label: 'mappingType', value: 'mappingType' },
				],
			},
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, contactId, sortBy, from, limit } = context.propsValue;
		const accounts = await zohoDeskApi.listContactAccounts({
			auth: context.auth,
			orgId,
			contactId,
			sortBy,
			from,
			limit,
		});
		return { accounts, count: accounts.length };
	},
});
