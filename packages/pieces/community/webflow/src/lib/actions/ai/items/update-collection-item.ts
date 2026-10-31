import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowCreateCollectionItemOutputSchema } from '../../../output-schemas';

export const updateCollectionItemAiAction = createAction({
	auth: webflowAuth,
	name: 'webflow_update_collection_item',
	outputSchema: webflowCreateCollectionItemOutputSchema,
	displayName: 'Update Collection Item',
	description: 'Updates the staged version of a CMS collection item.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates the staged version of one CMS collection item: only the fields in Field Data (keyed by field slug) and the flags you set change. Changes reach the live site after Publish Collection Items or a site publish; use Update Live Collection Item to change and publish at once. Set at least one of Field Data, Is Draft or Is Archived. Get the collection id from List Collections and the item id from List Collection Items.',
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
			description: '"true" holds the changes back from publishing; it never unpublishes a live item.',
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
			path: `/v2/collections/${encodeURIComponent(collectionId)}/items/${encodeURIComponent(itemId)}`,
			body: {
				...(hasFieldData ? { fieldData } : {}),
				...(isDraft !== undefined ? { isDraft: isDraft === 'true' } : {}),
				...(isArchived !== undefined ? { isArchived: isArchived === 'true' } : {}),
			},
		});
	},
});
