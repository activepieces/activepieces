import { createAction } from '@activepieces/pieces-framework';
import { webflowAuth } from '../..';
import { webflowProps } from '../common/props';
import { WebflowApiClient } from '../common/client';

export const webflowListCollections = createAction({
	auth: webflowAuth,
	name: 'list_collections',
	description: 'List all collections in a site',
	displayName: 'List Collections',
	audience: 'both',
	aiMetadata: { description: 'Lists all CMS collections within a given Webflow site, identified by site ID, returning their IDs and metadata. Use to discover a collection ID before reading, creating, or updating collection items. Read-only and idempotent.', idempotent: true },
	props: {
		site_id: webflowProps.site_id,
	},
	async run(context) {
		const client = new WebflowApiClient(context.auth.access_token);
		return await client.listCollections(context.propsValue.site_id);
	},
});
