import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowUpdateLiveCollectionItemsOutputSchema } from '../../../output-schemas';

export const updateLiveCollectionItemsAction = createAction({
	auth: webflowAuth,
	name: 'webflow_update_live_collection_items',
	outputSchema: webflowUpdateLiveCollectionItemsOutputSchema,
	displayName: 'Update Live Collection Items',
	description: 'Updates several CMS collection items and publishes the changes to the live site.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates several items of one CMS collection and publishes the changes to the live site in one request; each entry changes only the fields and flags it carries. Use Update Collection Items to change the staged versions without publishing, or Update Live Collection Item for a single item. A collection created since the last site publish returns 404 here until a site publish finishes (Publish Site returns before the publish is done; retry after a few seconds). Get the collection id from List Collections and the item ids from List Live Collection Items.',
		idempotent: true,
	},
	props: {
		collectionId: webflowAiProps.collectionId({ required: true }),
		items: Property.Json({
			displayName: 'Items',
			description:
				'Non-empty JSON array, one entry per item: {"id": "<item id>", "fieldData": {<field slug>: <value>}, "isArchived": false}. Only id is required; fieldData holds only the fields to change.',
			required: true,
		}),
	},
	async run(context) {
		const { collectionId, items } = context.propsValue;
		if (!Array.isArray(items) || items.length === 0) {
			throw new Error('Items must be a non-empty JSON array of items, each with an id.');
		}
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.PATCH,
			path: `/v2/collections/${encodeURIComponent(collectionId)}/items/live`,
			body: { items },
		});
	},
});
