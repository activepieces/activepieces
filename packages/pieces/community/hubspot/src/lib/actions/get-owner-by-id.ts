import { createAction, Property } from '@activepieces/pieces-framework';
import { hubspotAuth } from '../..';
import { Client } from '@hubspot/api-client';

export const getOwnerByIdAction = createAction({
	auth: hubspotAuth,
	name: 'get-owner-by-id',
	displayName: 'Get Owner by ID',
	description: 'Gets an existing owner by ID.',
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
