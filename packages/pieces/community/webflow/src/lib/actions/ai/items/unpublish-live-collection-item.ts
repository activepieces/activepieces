import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowDeleteCollectionItemOutputSchema } from '../../../output-schemas';

export const unpublishLiveCollectionItemAction = createAction({
	auth: webflowAuth,
	name: 'webflow_unpublish_live_collection_item',
	outputSchema: webflowDeleteCollectionItemOutputSchema,
	displayName: 'Unpublish Live Collection Item',
	description: 'Removes an item from the live site and keeps it in the CMS.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Removes one published item from the live site; the item stays in the CMS and can be published again with Publish Collection Items. Use Unpublish Live Collection Items for several at once, or Delete Collection Item to remove it for good. A collection created since the last site publish returns 404 here until a site publish finishes (Publish Site returns before the publish is done; retry after a few seconds). Get the collection id from List Collections and the item id from List Live Collection Items.',
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
			path: `/v2/collections/${encodeURIComponent(collectionId)}/items/${encodeURIComponent(itemId)}/live`,
		});
		return { success: true, collectionId, itemId };
	},
});
