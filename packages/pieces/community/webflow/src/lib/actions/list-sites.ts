import { createAction } from '@activepieces/pieces-framework';
import { webflowAuth } from '../..';
import { WebflowApiClient } from '../common/client';

export const webflowListSites = createAction({
	auth: webflowAuth,
	name: 'list_sites',
	description: 'List all sites',
	displayName: 'List Sites',
	audience: 'both',
	aiMetadata: { description: 'Lists all Webflow sites accessible to the authenticated account, returning their IDs and metadata. Use to discover a site ID needed by other actions (collections, orders, form-submission trigger). Read-only and idempotent; takes no input.', idempotent: true },
	props: {},
	async run(context) {
		const client = new WebflowApiClient(context.auth.access_token);
		return await client.listSites();
	},
});
