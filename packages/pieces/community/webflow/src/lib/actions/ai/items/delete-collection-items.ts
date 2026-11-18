import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowDeleteCollectionOutputSchema } from '../../../output-schemas';

export const deleteCollectionItemsAction = createAction({
	auth: webflowAuth,
	name: 'webflow_delete_collection_items',
	outputSchema: webflowDeleteCollectionOutputSchema,
	displayName: 'Delete Collection Items',
	description: 'Permanently deletes several items from a CMS collection.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes several items of one CMS collection in one request; they cannot be restored. To only take items off the live site and keep them in the CMS, use Unpublish Live Collection Items; for one item use Delete Collection Item. Get the collection id from List Collections and the item ids from List Collection Items.',
		idempotent: false,
	},
	props: {
		collectionId: webflowAiProps.collectionId({ required: true }),
		items: Property.Json({
			displayName: 'Items',
			description: 'Non-empty JSON array of the items to delete, e.g. [{"id": "<item id>"}, {"id": "<item id>"}].',
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
			path: `/v2/collections/${encodeURIComponent(collectionId)}/items`,
			body: { items },
		});
		return { success: true, collectionId };
	},
});
