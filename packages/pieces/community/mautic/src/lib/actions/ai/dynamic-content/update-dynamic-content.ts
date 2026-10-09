import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticGetDynamicContentOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticUpdateDynamicContentAction = createAction({
	auth: mauticAuth,
	name: 'mautic_update_dynamic_content',
	outputSchema: mauticGetDynamicContentOutputSchema,
	displayName: 'Update Dynamic Content',
	description: 'Updates fields of a Mautic dynamic content.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Updates an existing dynamic content item. Only the fields given are changed.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Dynamic Content Id',
			description:
				'Numeric dynamic content id, from List Dynamic Contents or Create Dynamic Content.',
		}),
		name: Property.ShortText({ displayName: 'Name', required: false }),
		content: Property.LongText({
			displayName: 'Content',
			description: 'HTML shown to matching contacts.',
			required: false,
		}),
		description: Property.LongText({ displayName: 'Description', required: false }),
		isCampaignBased: mauticAiProps.yesNo({
			displayName: 'Campaign Based',
			description: 'Yes when a campaign decides who sees it; No to use Slot Name and Filters.',
		}),
		slotName: Property.ShortText({
			displayName: 'Slot Name',
			description: 'Name of the slot on your site the content fills, when not campaign based.',
			required: false,
		}),
		filters: Property.Array({
			displayName: 'Filters',
			description: 'Contact filters that decide who sees it, in the segment filter shape.',
			required: false,
		}),
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
				'Other dynamic content properties, e.g. "publishUp", "publishDown", "utmTags". The dedicated props above win over the same keys here.',
		}),
	},
	async run(context) {
		const {
			id,
			additionalFields,
			name,
			content,
			description,
			isCampaignBased,
			slotName,
			filters,
			isPublished,
			category,
			language,
		} = context.propsValue;
		return await mauticApi.updateRecord({
			auth: context.auth,
			resource: 'dynamiccontents',
			id,
			body: {
				...additionalFields,
				...spreadIfDefined('name', name),
				...spreadIfDefined('content', content),
				...spreadIfDefined('description', description),
				...spreadIfDefined('isCampaignBased', isCampaignBased),
				...spreadIfDefined('slotName', slotName),
				...spreadIfDefined('filters', filters),
				...spreadIfDefined('isPublished', isPublished),
				...spreadIfDefined('category', category),
				...spreadIfDefined('language', language),
			},
		});
	},
});
