import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { codaAuth } from '../auth';
import { codaApi } from '../common/client';
import { getCurrentUserActionOutputSchema } from '../output-schemas';

export const getCurrentUserAction = createAction({
	auth: codaAuth,
	name: 'get_current_user',
	classification: 'READ',
	displayName: 'Get Current User',
	description: 'Returns the Coda account and workspace that the connected API token belongs to.',
	audience: 'both',
	aiMetadata: {
		description: 'Returns the name, login email and workspace of the Coda account behind this connection, and whether the token is limited to some docs. Use to confirm which account you are acting as. Read-only and idempotent.',
		idempotent: true,
	},
	props: {},
	outputSchema: getCurrentUserActionOutputSchema,
	async run(context) {
		return codaApi.request({
			token: context.auth.secret_text,
			method: HttpMethod.GET,
			path: '/whoami',
			operation: 'get current user',
		});
	},
});
