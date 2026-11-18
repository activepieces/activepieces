import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowCreateCollectionFieldOutputSchema } from '../../../output-schemas';

export const createCollectionFieldAction = createAction({
	auth: webflowAuth,
	name: 'webflow_create_collection_field',
	outputSchema: webflowCreateCollectionFieldOutputSchema,
	displayName: 'Create Collection Field',
	description: 'Adds a custom field to a CMS collection.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds one custom field to a CMS collection. Option fields need Options; Reference and MultiReference fields need Referenced Collection ID. To add several fields at once, pass them to Create Collection instead. Get the collection id from List Collections.',
		idempotent: false,
	},
	props: {
		collectionId: webflowAiProps.collectionId({ required: true }),
		type: Property.StaticDropdown({
			displayName: 'Type',
			description: 'Field type.',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'Color', value: 'Color' },
					{ label: 'DateTime', value: 'DateTime' },
					{ label: 'Email', value: 'Email' },
					{ label: 'File', value: 'File' },
					{ label: 'Image', value: 'Image' },
					{ label: 'Link', value: 'Link' },
					{ label: 'MultiImage', value: 'MultiImage' },
					{ label: 'MultiReference', value: 'MultiReference' },
					{ label: 'Number', value: 'Number' },
					{ label: 'Option', value: 'Option' },
					{ label: 'Phone', value: 'Phone' },
					{ label: 'PlainText', value: 'PlainText' },
					{ label: 'Reference', value: 'Reference' },
					{ label: 'RichText', value: 'RichText' },
					{ label: 'Switch', value: 'Switch' },
					{ label: 'VideoLink', value: 'VideoLink' },
				],
			},
		}),
		displayName: Property.ShortText({
			displayName: 'Name',
			description: 'Name of the field, e.g. "Post Body".',
			required: true,
		}),
		isRequired: webflowAiProps.flag({
			required: false,
			displayName: 'Required',
			description: 'Whether items must have a value for this field.',
		}),
		helpText: Property.ShortText({
			displayName: 'Help Text',
			description: 'Hint shown to whoever fills in the field.',
			required: false,
		}),
		options: Property.Array({
			displayName: 'Options',
			description: 'Choice names for an Option field, e.g. ["Feature", "News"]. Only for type Option.',
			required: false,
		}),
		referencedCollectionId: Property.ShortText({
			displayName: 'Referenced Collection ID',
			description:
				'Collection the field points to. Only for type Reference or MultiReference. Use List Collections to find it.',
			required: false,
		}),
	},
	async run(context) {
		const { collectionId, type, displayName, isRequired, helpText, options, referencedCollectionId } =
			context.propsValue;
		const optionNames = options ?? [];
		const isReference = type === 'Reference' || type === 'MultiReference';
		if ((type === 'Option') !== optionNames.length > 0) {
			throw new Error('options is required for type Option and only allowed for it.');
		}
		if (isReference !== Boolean(referencedCollectionId)) {
			throw new Error('referencedCollectionId is required for type Reference or MultiReference and only allowed for them.');
		}
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: `/v2/collections/${encodeURIComponent(collectionId)}/fields`,
			body: {
				type,
				displayName,
				...(isRequired !== undefined ? { isRequired: isRequired === 'true' } : {}),
				...(helpText ? { helpText } : {}),
				...(type === 'Option' ? { metadata: { options: optionNames.map((name) => ({ name })) } } : {}),
				...(isReference ? { metadata: { collectionId: referencedCollectionId } } : {}),
			},
		});
	},
});
