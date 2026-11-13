import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticGetAssetOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticUpdateAssetAction = createAction({
	auth: mauticAuth,
	name: 'mautic_update_asset',
	outputSchema: mauticGetAssetOutputSchema,
	displayName: 'Update Asset',
	description: 'Updates fields of a Mautic asset.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates an existing asset; a new Remote URL replaces the file. Only the fields given are changed.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Asset Id',
			description: 'Numeric asset id, from List Assets or Create Asset.',
		}),
		title: Property.ShortText({ displayName: 'Title', required: false }),
		file: Property.ShortText({
			displayName: 'Remote URL',
			description:
				'Public URL of the file, e.g. "https://example.com/guide.pdf". Mautic links to it rather than storing a copy.',
			required: false,
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
		const {
			id,
			additionalFields,
			title,
			file,
			alias,
			description,
			isPublished,
			category,
			language,
		} = context.propsValue;
		return await mauticApi.updateRecord({
			auth: context.auth,
			resource: 'assets',
			id,
			body: {
				...additionalFields,
				...spreadIfDefined('title', title),
				...(file ? { file, storageLocation: 'remote' } : {}),
				...spreadIfDefined('alias', alias),
				...spreadIfDefined('description', description),
				...spreadIfDefined('isPublished', isPublished),
				...spreadIfDefined('category', category),
				...spreadIfDefined('language', language),
			},
		});
	},
});
