import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowDeleteCollectionItemOutputSchema } from '../../../output-schemas';

export const deleteCollectionItemAiAction = createAction({
	auth: webflowAuth,
	name: 'webflow_delete_collection_item',
	outputSchema: webflowDeleteCollectionItemOutputSchema,
	displayName: 'Delete Collection Item',
	description: 'Permanently deletes an item from a CMS collection.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes one item from a CMS collection; it cannot be restored. To only take an item off the live site and keep it in the CMS, use Unpublish Live Collection Item; to delete several at once use Delete Collection Items. Get the collection id from List Collections and the item id from List Collection Items.',
		idempotent: false,
	},
	props: {
		collectionId: webflowAiProps.collectionId({ required: true }),
		itemId: webflowAiProps.itemId({ required: true }),
	},
	async run(context) {
		const { collectionId, itemId } = context.propsValue;
		await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.DELETE,
			path: `/v2/collections/${encodeURIComponent(collectionId)}/items/${encodeURIComponent(itemId)}`,
		});
		return { success: true, collectionId, itemId };
	},
});
