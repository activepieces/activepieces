import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowCreateLiveCollectionItemOutputSchema } from '../../../output-schemas';

export const createLiveCollectionItemAction = createAction({
	auth: webflowAuth,
	name: 'webflow_create_live_collection_item',
	outputSchema: webflowCreateLiveCollectionItemOutputSchema,
	displayName: 'Create Live Collection Item',
	description: 'Creates an item in a CMS collection and publishes it to the live site.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates one CMS collection item and publishes it to the live site at once. Field Data is keyed by field slug (from Get Collection) and must include name and slug; Option fields take the option id, Reference fields the referenced item id, Image and File fields {"url": "..."}. Use Create Collection Item to create a draft without publishing. A collection created since the last site publish returns 404 here until a site publish finishes (Publish Site returns before the publish is done; retry after a few seconds). Get the collection id from List Collections.',
		idempotent: false,
	},
	props: {
		collectionId: webflowAiProps.collectionId({ required: true }),
		fieldData: Property.Json({
			displayName: 'Field Data',
			description:
				'Field values keyed by field slug, e.g. {"name": "My post", "slug": "my-post", "summary": "..."}. name and slug are required.',
			required: true,
		}),
		isArchived: webflowAiProps.flag({
			required: false,
			displayName: 'Is Archived',
			description: 'Archived items are hidden from the site. Defaults to false.',
		}),
	},
	async run(context) {
		const { collectionId, fieldData, isArchived } = context.propsValue;
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: `/v2/collections/${encodeURIComponent(collectionId)}/items/live`,
			body: {
				fieldData,
				...(isArchived !== undefined ? { isArchived: isArchived === 'true' } : {}),
			},
		});
	},
});
