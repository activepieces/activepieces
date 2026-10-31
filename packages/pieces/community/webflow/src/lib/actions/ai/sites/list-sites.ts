import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowClient } from '../../../common/client';
import { webflowListSitesOutputSchema } from '../../../output-schemas';

export const listSitesAiAction = createAction({
	auth: webflowAuth,
	name: 'webflow_list_sites',
	outputSchema: webflowListSitesOutputSchema,
	displayName: 'List Sites',
	description: 'Lists the Webflow sites this connection can access.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists every Webflow site this connection can access, with each site\'s id, name, domains and locales. Start here to get the site id other actions need.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: '/v2/sites',
		});
	},
});
