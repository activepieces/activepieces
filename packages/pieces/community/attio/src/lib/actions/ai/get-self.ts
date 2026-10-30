import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioGetSelfOutputSchema } from '../../output-schemas';

export const attioGetSelfAction = createAction({
	auth: attioAuth,
	name: 'attio_get_self',
	outputSchema: attioGetSelfOutputSchema,
	displayName: 'Get Current Token',
	description: 'Identifies the access token, its workspace and scopes.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Returns whether the token is active, its workspace and granted scopes. Use it to check which actions the connection can run.',
		idempotent: true,
	},
	props: {

	},
	async run(context) {
		return attioApiCall<Record<string, unknown>>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: '/self',
		});
	},
});
