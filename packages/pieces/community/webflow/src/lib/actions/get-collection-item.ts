import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { webflowAuth } from '../auth';
import { webflowClient } from '../common/client';
import { webflowProps } from '../common/props';

export const getCollectionItemAction = createAction({
	auth: webflowAuth,
	name: 'get_collection_item',
	classification: 'READ',
	description: 'Get collection item in a collection by ID',
	displayName: 'Get a Collection Item by ID',
	audience: 'both',
	aiMetadata: { description: 'Retrieves a single Webflow CMS collection item by its collection ID and item ID. Use when the agent already knows the item ID and needs its full field data; if the ID is unknown, find it first with Find a Collection Item by Field. Read-only and idempotent.', idempotent: true },
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
			method: HttpMethod.GET,
			path: `/collections/${collectionId}/items/${collectionItemId}`,
		});
	},
});
