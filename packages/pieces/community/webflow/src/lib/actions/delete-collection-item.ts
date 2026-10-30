import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { webflowAuth } from '../auth';
import { webflowClient } from '../common/client';
import { webflowProps } from '../common/props';

export const deleteCollectionItemAction = createAction({
	auth: webflowAuth,
	name: 'delete_collection_item',
	classification: 'DESTRUCTIVE',
	description: 'Delete collection item',
	displayName: 'Delete an item in a collection',
	audience: 'both',
	aiMetadata: { description: 'Permanently deletes a single item from a Webflow CMS collection, identified by collection ID and item ID. Use when an agent needs to remove existing CMS content. Repeating the call after the item is gone has no further effect, so it is effectively idempotent on the same item ID.', idempotent: true },
	props: {
		site_id: webflowProps.siteId({ required: true }),
		collection_id: webflowProps.collectionId({ required: true }),
		collection_item_id: webflowProps.collectionItemId({ required: true }),
	},

	async run(context) {
		const collectionId = context.propsValue.collection_id;
		const collectionItemId = context.propsValue.collection_item_id;

		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.DELETE,
			path: `/collections/${collectionId}/items/${collectionItemId}`,
		});
	},
});
