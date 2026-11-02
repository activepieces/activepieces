import { nocodbAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { nocodbGetCurrentUserOutputSchema } from '../output-schemas';

export const getCurrentUserAction = createAction({
	auth: nocodbAuth,
	name: 'nocodb-get-current-user',
	outputSchema: nocodbGetCurrentUserOutputSchema,
	classification: 'READ',
	displayName: 'Get Current User',
	description: 'Returns the profile and roles of the authenticated user.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns the identity, email, and roles of the account the connection belongs to, optionally scoped to a base. Use to confirm which account is authenticated or to check its role before a write. Idempotent read-only lookup.',
		idempotent: true,
	},
	props: {
		baseId: Property.ShortText({
			displayName: 'Base ID',
			required: false,
		}),
	},
	async run(context) {
		const { baseId } = context.propsValue;
		const client = makeClient(context.auth);
		return await client.getCurrentUser(baseId);
	},
});
