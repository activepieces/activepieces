import { createAction, Property } from '@activepieces/pieces-framework';
import { hubspotAuth } from '../..';
import { Client } from '@hubspot/api-client';

export const getOwnerByEmailAction = createAction({
	auth: hubspotAuth,
	name: 'get-owner-by-email',
	displayName: 'Get Owner by Email',
	description: 'Gets an existing owner by email.',
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
