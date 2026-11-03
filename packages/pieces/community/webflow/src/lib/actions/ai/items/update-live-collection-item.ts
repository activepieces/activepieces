import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowCreateLiveCollectionItemOutputSchema } from '../../../output-schemas';

export const updateLiveCollectionItemAction = createAction({
	auth: webflowAuth,
	name: 'webflow_update_live_collection_item',
	outputSchema: webflowCreateLiveCollectionItemOutputSchema,
	displayName: 'Update Live Collection Item',
	description: 'Updates a CMS collection item and publishes the change to the live site.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates one CMS collection item and publishes the change to the live site at once: only the fields in Field Data (keyed by field slug) and the flags you set change. Use Update Collection Item to change the staged version without publishing. Set at least one of Field Data, Is Draft or Is Archived. A collection created since the last site publish returns 404 here until a site publish finishes (Publish Site returns before the publish is done; retry after a few seconds). Get the collection id from List Collections and the item id from List Live Collection Items.',
		idempotent: true,
	},
	props: {
		collectionId: webflowAiProps.collectionId({ required: true }),
		itemId: webflowAiProps.itemId({ required: true }),
		fieldData: Property.Json({
			displayName: 'Field Data',
			description:
				'Only the field values to change, keyed by field slug, e.g. {"summary": "..."}. Option fields take the option id, Reference fields the referenced item id, Image and File fields {"url": "..."}.',
			required: false,
		}),
		isDraft: webflowAiProps.flag({
			required: false,
			displayName: 'Is Draft',
			description: 'Sets the item\'s draft state.',
		}),
		isArchived: webflowAiProps.flag({
			required: false,
			displayName: 'Is Archived',
			description: 'Archived items are hidden from the site.',
		}),
	},
	async run(context) {
		const { collectionId, itemId, fieldData, isDraft, isArchived } = context.propsValue;
		const hasFieldData = fieldData !== undefined && fieldData !== null && Object.keys(fieldData).length > 0;
		if (!hasFieldData && isDraft === undefined && isArchived === undefined) {
			throw new Error('Set at least one of Field Data, Is Draft or Is Archived.');
		}
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.PATCH,
			path: `/v2/collections/${encodeURIComponent(collectionId)}/items/${encodeURIComponent(itemId)}/live`,
			body: {
				...(hasFieldData ? { fieldData } : {}),
				...(isDraft !== undefined ? { isDraft: isDraft === 'true' } : {}),
				...(isArchived !== undefined ? { isArchived: isArchived === 'true' } : {}),
			},
		});
	},
});
