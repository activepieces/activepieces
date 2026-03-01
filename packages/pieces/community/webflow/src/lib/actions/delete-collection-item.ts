import { createAction } from '@activepieces/pieces-framework';

import { webflowAuth } from '../..';
import { webflowProps } from '../common/props';
import { WebflowApiClient } from '../common/client';

export const webflowDeleteCollectionItem = createAction({
	auth: webflowAuth,
	name: 'delete_collection_item',
	description: 'Delete collection item',
	displayName: 'Delete an item in a collection',
	props: {
		site_id: webflowProps.site_id,
		collection_id: webflowProps.collection_id,
		collection_item_id: webflowProps.collection_item_id,
	},

	async run(context) {
		const collectionId = context.propsValue.collection_id;
		const collectionItemId = context.propsValue.collection_item_id;

		const client = new WebflowApiClient(context.auth.access_token);

		return await client.deleteCollectionItem(collectionId, collectionItemId);
	},
});
