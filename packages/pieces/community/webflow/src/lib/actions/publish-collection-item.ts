import { createAction } from '@activepieces/pieces-framework';

import { webflowAuth } from '../..';
import { webflowProps } from '../common/props';
import { WebflowApiClient } from '../common/client';

export const webflowPublishCollectionItem = createAction({
	auth: webflowAuth,
	name: 'publish_collection_item',
	description: 'Publish collection item',
	displayName: 'Publish a Collection Item',
	props: {
		site_id: webflowProps.site_id,
		collection_id: webflowProps.collection_id,
		collection_item_id: webflowProps.collection_item_id,
	},

	async run(context) {
		const collectionId = context.propsValue.collection_id;
		const collectionItemId = context.propsValue.collection_item_id;

		const client = new WebflowApiClient(context.auth.access_token);

		return await client.publishCollectionItem(collectionId, collectionItemId);
	},
});
