import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowClient } from '../../../common/client';
import { webflowGetTokenInfoOutputSchema } from '../../../output-schemas';

export const getTokenInfoAction = createAction({
	auth: webflowAuth,
	name: 'webflow_get_token_info',
	outputSchema: webflowGetTokenInfoOutputSchema,
	displayName: 'Get Token Info',
	description: 'Gets the workspaces, sites and scopes this connection can access.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns what this connection is authorized for: its scopes, the workspace and site ids it can reach, and the app it belongs to. Use it to check access before calling site or workspace actions.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: '/v2/token/introspect',
		});
	},
});
