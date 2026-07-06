import { createAction, Property } from '@activepieces/pieces-framework';
import { hubspotAuth } from '../auth';
import { Client } from '@hubspot/api-client';

export const getOwnerByEmailAction = createAction({
	auth: hubspotAuth,
	name: 'get-owner-by-email',
	displayName: 'Get Owner by Email',
	description: 'Gets an existing owner by email.',
	audience: 'both',
	aiMetadata: {
		description:
			'Look up a single HubSpot CRM owner (user) by their email address; use to resolve an email into an owner identity before assigning records to that owner. Read-only and repeatable. Fails if no owner matches the given email.',
		idempotent: true,
	},
	props: {
		email: Property.ShortText({
			displayName: 'Owner Email',
			required: true,
		}),
	},
	async run(context) {
		const { email } = context.propsValue;
		const client = new Client({ accessToken: context.auth.access_token });

		const response = await client.crm.owners.ownersApi.getPage(email);
		return response;
	},
});
