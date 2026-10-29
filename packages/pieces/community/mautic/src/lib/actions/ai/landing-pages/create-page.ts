import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticCreatePageOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticCreatePageAction = createAction({
	auth: mauticAuth,
	name: 'mautic_create_page',
	outputSchema: mauticCreatePageOutputSchema,
	displayName: 'Create Landing Page',
	description: 'Creates a Mautic landing page.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Creates a landing page. Title is required.',
		idempotent: false,
	},
	props: {
		title: Property.ShortText({ displayName: 'Title', required: true }),
		alias: Property.ShortText({
			displayName: 'Alias',
			description: 'Used in the page URL; generated from the title when empty.',
			required: false,
		}),
		customHtml: Property.LongText({
			displayName: 'HTML',
			description: 'Full HTML of the page.',
			required: false,
		}),
		template: Property.ShortText({
			displayName: 'Theme',
			description: 'Theme name to build the page from, e.g. "blank".',
			required: false,
		}),
		metaDescription: Property.ShortText({ displayName: 'Meta Description', required: false }),
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
		redirectType: Property.StaticDropdown({
			displayName: 'Redirect Type',
			description: 'Redirect used when the page is unpublished.',
			required: false,
			options: {
				options: [
					{ label: '301 Permanent', value: '301' },
					{ label: '302 Temporary', value: '302' },
				],
			},
		}),
		redirectUrl: Property.ShortText({ displayName: 'Redirect URL', required: false }),
		additionalFields: mauticAiProps.additionalFields({
			description:
				'Other page properties, e.g. "publishUp", "publishDown", "isPreferenceCenter", "noIndex". The dedicated props above win over the same keys here.',
		}),
	},
	async run(context) {
		const {
			additionalFields,
			title,
			alias,
			customHtml,
			template,
			metaDescription,
			isPublished,
			category,
			language,
			redirectType,
			redirectUrl,
		} = context.propsValue;
		return await mauticApi.createRecord({
			auth: context.auth,
			resource: 'pages',
			body: {
				...additionalFields,
				...spreadIfDefined('title', title),
				...spreadIfDefined('alias', alias),
				...spreadIfDefined('customHtml', customHtml),
				...spreadIfDefined('template', template),
				...spreadIfDefined('metaDescription', metaDescription),
				...spreadIfDefined('isPublished', isPublished),
				...spreadIfDefined('category', category),
				...spreadIfDefined('language', language),
				...spreadIfDefined('redirectType', redirectType),
				...spreadIfDefined('redirectUrl', redirectUrl),
			},
		});
	},
});
