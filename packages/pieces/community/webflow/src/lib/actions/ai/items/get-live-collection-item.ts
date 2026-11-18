import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowCreateLiveCollectionItemOutputSchema } from '../../../output-schemas';

export const getLiveCollectionItemAction = createAction({
	auth: webflowAuth,
	name: 'webflow_get_live_collection_item',
	outputSchema: webflowCreateLiveCollectionItemOutputSchema,
	displayName: 'Get Live Collection Item',
	description: 'Gets the published version of a CMS collection item.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets the live (published) version of one CMS collection item by id, with its field data keyed by field slug. For the staged version, including unpublished changes, use Get Collection Item. A collection created since the last site publish returns 404 here until a site publish finishes (Publish Site returns before the publish is done; retry after a few seconds). Get the collection id from List Collections and the item id from List Live Collection Items.',
		idempotent: true,
	},
	props: {
		collectionId: webflowAiProps.collectionId({ required: true }),
		itemId: webflowAiProps.itemId({ required: true }),
	},
	async run(context) {
		const { collectionId, itemId } = context.propsValue;
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `/v2/collections/${encodeURIComponent(collectionId)}/items/${encodeURIComponent(itemId)}/live`,
		});
	},
});
