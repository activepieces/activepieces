import { createAction, Property } from '@activepieces/pieces-framework';
import { hubspotAuth } from '../auth';
import { Client } from '@hubspot/api-client';

export const getOwnerByIdAction = createAction({
	auth: hubspotAuth,
	name: 'get-owner-by-id',
	displayName: 'Get Owner by ID',
	description: 'Gets an existing owner by ID.',
	audience: 'both',
	aiMetadata: { description: 'Fetches a single HubSpot owner (user) by their numeric owner ID, returning their identity details such as name and email. Use to resolve an owner ID into a person before assigning records or displaying who owns a deal, contact, or ticket. Read-only and idempotent.', idempotent: true },
	props: {
		ownerId: Property.ShortText({
			displayName: 'Owner ID',
			required: true,
		}),
	},
	async run(context) {
		const { ownerId } = context.propsValue;
		const client = new Client({ accessToken: context.auth.access_token });

		const response = await client.crm.owners.ownersApi.getById(Number(ownerId));
		return response;
	},
});
