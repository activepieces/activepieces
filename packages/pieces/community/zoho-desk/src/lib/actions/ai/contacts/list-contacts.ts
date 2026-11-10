import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskGetContactsByIdsOutputSchema } from '../../../output-schemas';

export const zohoDeskListContactsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_contacts',
	outputSchema: zohoDeskGetContactsByIdsOutputSchema,
	displayName: 'List Contacts',
	description: 'Lists contacts.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists contacts in an organization, optionally from a view. Use Search Contacts to find contacts by name, email or phone. Page with From and Limit.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		viewId: Property.ShortText({
			displayName: 'View ID',
			description: 'Contact view ID (from List Views, module contacts).',
			required: false,
		}),
		sortBy: Property.StaticDropdown({
			displayName: 'Sort By',
			description: 'Field to sort by.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'firstName', value: 'firstName' },
					{ label: 'lastName', value: 'lastName' },
					{ label: 'email', value: 'email' },
					{ label: 'phone', value: 'phone' },
					{ label: 'account', value: 'account' },
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
		const contacts = await zohoDeskApi.listContacts({
			auth: context.auth,
			orgId,
			viewId,
			sortBy,
			from,
			limit,
		});
		return { contacts, count: contacts.length };
	},
});
