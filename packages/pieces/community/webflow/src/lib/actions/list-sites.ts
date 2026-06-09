import { createAction } from '@activepieces/pieces-framework';
import { webflowAuth } from '../..';
import { WebflowApiClient } from '../common/client';

export const webflowListSites = createAction({
	auth: webflowAuth,
	name: 'list_sites',
	description: 'List all sites',
	displayName: 'List Sites',
	props: {},
	async run(context) {
		const client = new WebflowApiClient(context.auth.access_token);
		return await client.listSites();
	},
});
