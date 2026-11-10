import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowDeleteCollectionOutputSchema } from '../../../output-schemas';

export const unpublishLiveCollectionItemsAction = createAction({
	auth: webflowAuth,
	name: 'webflow_unpublish_live_collection_items',
	outputSchema: webflowDeleteCollectionOutputSchema,
	displayName: 'Unpublish Live Collection Items',
	description: 'Removes several items from the live site and keeps them in the CMS.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Removes several published items of one CMS collection from the live site in one request; the items stay in the CMS and can be published again with Publish Collection Items. Use Delete Collection Items to remove them for good, or Unpublish Live Collection Item for one item. A collection created since the last site publish returns 404 here until a site publish finishes (Publish Site returns before the publish is done; retry after a few seconds). Get the collection id from List Collections and the item ids from List Live Collection Items.',
		idempotent: false,
	},
	props: {
		collectionId: webflowAiProps.collectionId({ required: true }),
		items: Property.Json({
			displayName: 'Items',
			description: 'Non-empty JSON array of the items to unpublish, e.g. [{"id": "<item id>"}, {"id": "<item id>"}].',
			required: true,
		}),
	},
	async run(context) {
		const { collectionId, items } = context.propsValue;
		if (!Array.isArray(items) || items.length === 0) {
			throw new Error('Items must be a non-empty JSON array of items, each with an id.');
		}
		await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.DELETE,
			path: `/v2/collections/${encodeURIComponent(collectionId)}/items/live`,
			body: { items },
		});
		return { success: true, collectionId };
	},
});
