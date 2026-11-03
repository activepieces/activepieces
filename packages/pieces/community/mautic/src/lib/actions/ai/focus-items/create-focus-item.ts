import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticCreateFocusItemOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticCreateFocusItemAction = createAction({
	auth: mauticAuth,
	name: 'mautic_create_focus_item',
	outputSchema: mauticCreateFocusItemOutputSchema,
	displayName: 'Create Focus Item',
	description: 'Creates a Mautic focus item.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Creates a focus item. Name, Type and Style are required. Needs the Focus plugin.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({ displayName: 'Name', required: true }),
		type: Property.StaticDropdown({
			displayName: 'Type',
			required: true,
			options: {
				options: [
					{ label: 'Collect data (form)', value: 'form' },
					{ label: 'Display a notice', value: 'notice' },
					{ label: 'Emphasize a link', value: 'link' },
				],
			},
		}),
		style: Property.StaticDropdown({
			displayName: 'Style',
			required: true,
			options: {
				options: [
					{ label: 'Bar', value: 'bar' },
					{ label: 'Modal', value: 'modal' },
					{ label: 'Notification', value: 'notification' },
					{ label: 'Full page', value: 'page' },
				],
			},
		}),
		website: Property.ShortText({
			displayName: 'Website',
			description: 'URL of the site the focus item runs on.',
			required: false,
		}),
		form: Property.Number({
			displayName: 'Form Id',
			description: 'Form to show for the "form" type, from List Forms.',
			required: false,
		}),
		description: Property.LongText({ displayName: 'Description', required: false }),
		isPublished: mauticAiProps.yesNo({ displayName: 'Published' }),
		category: Property.Number({
			displayName: 'Category Id',
			description: 'Category id, from List Categories.',
			required: false,
		}),
		properties: Property.Json({
			displayName: 'Properties',
			description:
				'Display settings, e.g. {"bar": {"size": "large", "placement": "top"}, "content": {"headline": "Hi", "link_text": "Go", "link_url": "https://example.com"}, "when": "immediately"}.',
			required: false,
		}),
		additionalFields: mauticAiProps.additionalFields({
			description:
				'Other focus item properties, e.g. "publishUp", "publishDown", "utmTags", "html". The dedicated props above win over the same keys here.',
		}),
	},
	async run(context) {
		const {
			additionalFields,
			name,
			type,
			style,
			website,
			form,
			description,
			isPublished,
			category,
			properties,
		} = context.propsValue;
		return await mauticApi.createRecord({
			auth: context.auth,
			resource: 'focus',
			body: {
				...additionalFields,
				...spreadIfDefined('name', name),
				...spreadIfDefined('type', type),
				...spreadIfDefined('style', style),
				...spreadIfDefined('website', website),
				...spreadIfDefined('form', form),
				...spreadIfDefined('description', description),
				...spreadIfDefined('isPublished', isPublished),
				...spreadIfDefined('category', category),
				...spreadIfDefined('properties', properties),
			},
		});
	},
});
