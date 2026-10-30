import { createAction } from '@activepieces/pieces-framework';
import { webflowAuth } from '../auth';
import { webflowApi } from '../common/api';

export const listSitesAction = createAction({
	auth: webflowAuth,
	name: 'list_sites',
	classification: 'SEARCH',
	description: 'List all sites',
	displayName: 'List Sites',
	audience: 'both',
	aiMetadata: { description: 'Lists all Webflow sites accessible to the authenticated account, returning their IDs and metadata. Use to discover a site ID needed by other actions (collections, orders, form-submission trigger). Read-only and idempotent; takes no input.', idempotent: true },
	props: {},
	async run(context) {
		return await webflowApi.listSites({ auth: context.auth });
	},
});
