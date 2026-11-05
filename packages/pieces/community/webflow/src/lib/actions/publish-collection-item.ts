import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { webflowAuth } from '../auth';
import { webflowClient } from '../common/client';
import { webflowProps } from '../common/props';
import { publishCollectionItemOutputSchema } from '../output-schemas';

export const publishCollectionItemAction = createAction({
	auth: webflowAuth,
	name: 'publish_collection_item',
	outputSchema: publishCollectionItemOutputSchema,
	classification: 'WRITE',
	description: 'Publish collection item',
	displayName: 'Publish a Collection Item',
	audience: 'human',
	aiMetadata: { description: 'Publishes a Webflow CMS collection item live, identified by collection ID and item ID, so its current content goes to the live site. Use after creating or updating a draft item to make it public. Idempotent: re-publishing the same item again leaves it published.', idempotent: true },
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
			method: HttpMethod.POST,
			path: `/v2/collections/${encodeURIComponent(collectionId)}/items/publish`,
			body: { itemIds: [collectionItemId] },
		});
	},
});
