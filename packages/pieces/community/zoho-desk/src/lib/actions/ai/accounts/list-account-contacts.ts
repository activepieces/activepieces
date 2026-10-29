import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListAccountContactsOutputSchema } from '../../../output-schemas';

export const zohoDeskListAccountContactsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_account_contacts',
	outputSchema: zohoDeskListAccountContactsOutputSchema,
	displayName: 'List Account Contacts',
	description: 'Lists the contacts of an account.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: { description: 'Lists the contacts linked to one account.', idempotent: true },
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		accountId: zohoDeskAiProps.accountId({ required: true }),
		sortBy: Property.StaticDropdown({
			displayName: 'Sort By',
			description: 'Field to sort by.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'firstName', value: 'firstName' },
					{ label: 'lastName', value: 'lastName' },
					{ label: 'fullName', value: 'fullName' },
					{ label: 'email', value: 'email' },
					{ label: 'phone', value: 'phone' },
					{ label: 'createdTime', value: 'createdTime' },
					{ label: 'modifiedTime', value: 'modifiedTime' },
				],
			},
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, accountId, sortBy, from, limit } = context.propsValue;
		const contacts = await zohoDeskApi.listAccountContacts({
			auth: context.auth,
			orgId,
			accountId,
			sortBy,
			from,
			limit,
		});
		return { contacts, count: contacts.length };
	},
});
