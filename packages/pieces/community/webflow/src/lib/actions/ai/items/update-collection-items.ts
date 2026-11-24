import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowUpdateCollectionItemsOutputSchema } from '../../../output-schemas';

export const updateCollectionItemsAction = createAction({
	auth: webflowAuth,
	name: 'webflow_update_collection_items',
	outputSchema: webflowUpdateCollectionItemsOutputSchema,
	displayName: 'Update Collection Items',
	description: 'Updates the staged version of several CMS collection items in one request.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates the staged version of several items of one CMS collection in one request; each entry changes only the fields and flags it carries. Changes reach the live site after Publish Collection Items or a site publish; use Update Live Collection Items to change and publish at once, or Update Collection Item for a single item. Get the collection id from List Collections and the item ids from List Collection Items.',
		idempotent: true,
	},
	props: {
		collectionId: webflowAiProps.collectionId({ required: true }),
		items: Property.Json({
			displayName: 'Items',
			description:
				'Non-empty JSON array, one entry per item: {"id": "<item id>", "fieldData": {<field slug>: <value>}, "isDraft": false, "isArchived": false}. Only id is required; fieldData holds only the fields to change.',
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
			path: `/v2/collections/${encodeURIComponent(collectionId)}/items`,
			body: { items },
		});
	},
});
