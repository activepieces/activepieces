import { createAction } from '@activepieces/pieces-framework';

import { webflowAuth } from '../..';
import { webflowProps } from '../common/props';
import { WebflowApiClient } from '../common/client';

export const webflowDeleteCollectionItem = createAction({
	auth: webflowAuth,
	name: 'delete_collection_item',
	description: 'Delete collection item',
	displayName: 'Delete an item in a collection',
	audience: 'both',
	aiMetadata: { description: 'Permanently deletes a single item from a Webflow CMS collection, identified by collection ID and item ID. Use when an agent needs to remove existing CMS content. Repeating the call after the item is gone has no further effect, so it is effectively idempotent on the same item ID.', idempotent: true },
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
