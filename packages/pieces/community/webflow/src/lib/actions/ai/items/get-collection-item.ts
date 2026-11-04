import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowCreateCollectionItemOutputSchema } from '../../../output-schemas';

export const getCollectionItemAiAction = createAction({
	auth: webflowAuth,
	name: 'webflow_get_collection_item',
	outputSchema: webflowCreateCollectionItemOutputSchema,
	displayName: 'Get Collection Item',
	description: 'Gets the staged item from a CMS collection.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one staged item of a CMS collection by id, with its field data (keyed by field slug) and draft, archived and publish state, including unpublished changes. For the version on the live site use Get Live Collection Item. Get the collection id from List Collections and the item id from List Collection Items.',
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
			path: `/v2/collections/${encodeURIComponent(collectionId)}/items/${encodeURIComponent(itemId)}`,
		});
	},
});
