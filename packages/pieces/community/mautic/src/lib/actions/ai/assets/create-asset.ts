import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticCreateAssetOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticCreateAssetAction = createAction({
	auth: mauticAuth,
	name: 'mautic_create_asset',
	outputSchema: mauticCreateAssetOutputSchema,
	displayName: 'Create Asset',
	description: 'Creates a Mautic asset.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates an asset that points to a file at a remote URL. Title and Remote URL are required.',
		idempotent: false,
	},
	props: {
		title: Property.ShortText({ displayName: 'Title', required: true }),
		file: Property.ShortText({
			displayName: 'Remote URL',
			description:
				'Public URL of the file, e.g. "https://example.com/guide.pdf". Mautic links to it rather than storing a copy.',
			required: true,
		}),
		alias: Property.ShortText({ displayName: 'Alias', required: false }),
		description: Property.LongText({ displayName: 'Description', required: false }),
		isPublished: mauticAiProps.yesNo({ displayName: 'Published' }),
		category: Property.Number({
			displayName: 'Category Id',
			description: 'Category id, from List Categories.',
			required: false,
		}),
		language: Property.ShortText({
			displayName: 'Language',
			description: 'Locale code, e.g. "en".',
			required: false,
		}),
		additionalFields: mauticAiProps.additionalFields({
			description:
				'Other asset properties, e.g. "publishUp", "publishDown". The dedicated props above win over the same keys here.',
		}),
	},
	async run(context) {
		const { additionalFields, title, file, alias, description, isPublished, category, language } =
			context.propsValue;
		return await mauticApi.createRecord({
			auth: context.auth,
			resource: 'assets',
			body: {
				...additionalFields,
				storageLocation: 'remote',
				...spreadIfDefined('title', title),
				...spreadIfDefined('file', file),
				...spreadIfDefined('alias', alias),
				...spreadIfDefined('description', description),
				...spreadIfDefined('isPublished', isPublished),
				...spreadIfDefined('category', category),
				...spreadIfDefined('language', language),
			},
		});
	},
});
