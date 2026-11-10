import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowCreateCollectionFieldOutputSchema } from '../../../output-schemas';

export const updateCollectionFieldAction = createAction({
	auth: webflowAuth,
	name: 'webflow_update_collection_field',
	outputSchema: webflowCreateCollectionFieldOutputSchema,
	displayName: 'Update Collection Field',
	description: "Updates a collection field's name, help text or required flag.",
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Changes a custom field's name, help text or required flag; only the values given are changed and the type cannot change. Get the collection id from List Collections and the field id from Get Collection.",
		idempotent: true,
	},
	props: {
		collectionId: webflowAiProps.collectionId({ required: true }),
		fieldId: Property.ShortText({
			displayName: 'Field ID',
			description: 'Field to update. Use Get Collection to find it.',
			required: true,
		}),
		displayName: Property.ShortText({
			displayName: 'Name',
			description: 'New name of the field.',
			required: false,
		}),
		helpText: Property.ShortText({
			displayName: 'Help Text',
			description: 'New hint shown to whoever fills in the field.',
			required: false,
		}),
		isRequired: webflowAiProps.flag({
			required: false,
			displayName: 'Required',
			description: 'Whether items must have a value for this field.',
		}),
	},
	async run(context) {
		const { collectionId, fieldId, displayName, helpText, isRequired } = context.propsValue;
		if (displayName === undefined && helpText === undefined && isRequired === undefined) {
			throw new Error('Set at least one of displayName, helpText or isRequired.');
		}
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.PATCH,
			path: `/v2/collections/${encodeURIComponent(collectionId)}/fields/${encodeURIComponent(fieldId)}`,
			body: {
				...(displayName !== undefined ? { displayName } : {}),
				...(helpText !== undefined ? { helpText } : {}),
				...(isRequired !== undefined ? { isRequired: isRequired === 'true' } : {}),
			},
		});
	},
});
