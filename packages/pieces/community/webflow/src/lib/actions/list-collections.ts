import { createAction } from '@activepieces/pieces-framework';
import { webflowAuth } from '../auth';
import { webflowApi } from '../common/api';
import { webflowProps } from '../common/props';
import { listCollectionsOutputSchema } from '../output-schemas';

export const listCollectionsAction = createAction({
	auth: webflowAuth,
	name: 'list_collections',
	outputSchema: listCollectionsOutputSchema,
	classification: 'SEARCH',
	description: 'List all collections in a site',
	displayName: 'List Collections',
	audience: 'human',
	aiMetadata: { description: 'Lists all CMS collections within a given Webflow site, identified by site ID, returning their IDs and metadata. Use to discover a collection ID before reading, creating, or updating collection items. Read-only and idempotent.', idempotent: true },
	props: {
		site_id: webflowProps.siteId({ required: true }),
	},
	async run(context) {
		return await webflowApi.listCollections({ auth: context.auth, siteId: context.propsValue.site_id });
	},
});
