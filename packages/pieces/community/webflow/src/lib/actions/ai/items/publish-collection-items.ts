import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { publishCollectionItemOutputSchema } from '../../../output-schemas';

export const publishCollectionItemsAction = createAction({
	auth: webflowAuth,
	name: 'webflow_publish_collection_items',
	outputSchema: publishCollectionItemOutputSchema,
	displayName: 'Publish Collection Items',
	description: 'Publishes staged CMS collection items to the live site.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Publishes the staged version of one or more items of a CMS collection to the live site, without publishing the rest of the site. The response lists the published item ids and any per-item errors. A collection created since the last site publish returns 404 here until a site publish finishes (Publish Site returns before the publish is done; retry after a few seconds). Get the collection id from List Collections and the item ids from List Collection Items or Create Collection Item.',
		idempotent: true,
	},
	props: {
		collectionId: webflowAiProps.collectionId({ required: true }),
		itemIds: Property.Array({
			displayName: 'Item IDs',
			description: 'IDs of the items to publish, all from this collection.',
			required: true,
		}),
	},
	async run(context) {
		const { collectionId, itemIds } = context.propsValue;
		if (!Array.isArray(itemIds) || itemIds.length === 0) {
			throw new Error('Item IDs must be a non-empty array of item ids.');
		}
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: `/v2/collections/${encodeURIComponent(collectionId)}/items/publish`,
			body: { itemIds },
		});
	},
});
