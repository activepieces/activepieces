import { createAction, Property } from '@activepieces/pieces-framework';
import { zohoDeskAuth } from '../auth';
import { zohoDeskApi } from '../common/api';
import { zohoDeskProps } from '../common/props';
import { findContactOutputSchema } from '../output-schemas';

export const findContactAction = createAction({
	auth: zohoDeskAuth,
	name: 'find-contact',
	outputSchema: findContactOutputSchema,
	classification: 'SEARCH',
	displayName: 'Find Contact',
	description: 'Finds an existing contact by email.',
	audience: 'human',
	aiMetadata: { description: 'Searches a Zoho Desk organization for contacts matching an exact email address, returning whether any were found along with the matches. Use to resolve a contact (e.g. before creating or routing a ticket) when you have the email rather than an ID; requires the organization ID and email. Read-only and idempotent.', idempotent: true },
	props: {
		orgId: zohoDeskProps.orgId({ required: true }),
		email: Property.ShortText({
			displayName: 'Email',
			required: true,
		}),
	},
	async run(context) {
		const contacts = await zohoDeskApi.searchContacts({
			auth: context.auth,
			orgId: context.propsValue.orgId,
			email: context.propsValue.email,
		});

		return {
			found: contacts.length > 0,
			result: contacts,
		};
	},
});
