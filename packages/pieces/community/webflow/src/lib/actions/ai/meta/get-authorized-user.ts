import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowClient } from '../../../common/client';
import { webflowGetAuthorizedUserOutputSchema } from '../../../output-schemas';

export const getAuthorizedUserAction = createAction({
	auth: webflowAuth,
	name: 'webflow_get_authorized_user',
	outputSchema: webflowGetAuthorizedUserOutputSchema,
	displayName: 'Get Authorized User',
	description: 'Gets the Webflow user who authorized this connection.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns the id, email and name of the Webflow user who authorized this connection. Use it to confirm which account the connection acts as.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: '/v2/token/authorized_by',
		});
	},
});
