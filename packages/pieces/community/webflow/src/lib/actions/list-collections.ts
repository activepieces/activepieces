import { createAction } from '@activepieces/pieces-framework';
import { webflowAuth } from '../..';
import { webflowProps } from '../common/props';
import { WebflowApiClient } from '../common/client';

export const webflowListCollections = createAction({
	auth: webflowAuth,
	name: 'list_collections',
	description: 'List all collections in a site',
	displayName: 'List Collections',
	props: {
		site_id: webflowProps.site_id,
	},
	async run(context) {
		const client = new WebflowApiClient(context.auth.access_token);
		return await client.listCollections(context.propsValue.site_id);
	},
});
