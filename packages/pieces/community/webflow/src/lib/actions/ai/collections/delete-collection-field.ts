import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowDeleteCollectionFieldOutputSchema } from '../../../output-schemas';

export const deleteCollectionFieldAction = createAction({
	auth: webflowAuth,
	name: 'webflow_delete_collection_field',
	outputSchema: webflowDeleteCollectionFieldOutputSchema,
	displayName: 'Delete Collection Field',
	description: 'Deletes a custom field from a CMS collection.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			"Permanently deletes a custom field and its values on every item of the collection; there is no undo. Webflow's own Name and Slug fields cannot be deleted. Get the collection id from List Collections and the field id from Get Collection.",
		idempotent: false,
	},
	props: {
		collectionId: webflowAiProps.collectionId({ required: true }),
		fieldId: Property.ShortText({
			displayName: 'Field ID',
			description: 'Field to delete. Use Get Collection to find it.',
			required: true,
		}),
	},
	async run(context) {
		const { collectionId, fieldId } = context.propsValue;
		await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.DELETE,
			path: `/v2/collections/${encodeURIComponent(collectionId)}/fields/${encodeURIComponent(fieldId)}`,
		});
		return { success: true, collectionId, fieldId };
	},
});
