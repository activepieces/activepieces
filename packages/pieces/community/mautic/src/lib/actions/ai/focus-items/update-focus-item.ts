import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticGetFocusItemOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticUpdateFocusItemAction = createAction({
	auth: mauticAuth,
	name: 'mautic_update_focus_item',
	outputSchema: mauticGetFocusItemOutputSchema,
	displayName: 'Update Focus Item',
	description: 'Updates fields of a Mautic focus item.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates an existing focus item. Needs the Focus plugin. Only the fields given are changed.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Focus Item Id',
			description: 'Numeric focus item id, from List Focus Items or Create Focus Item.',
		}),
		name: Property.ShortText({ displayName: 'Name', required: false }),
		type: Property.StaticDropdown({
			displayName: 'Type',
			required: false,
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
			required: false,
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
			id,
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
		return await mauticApi.updateRecord({
			auth: context.auth,
			resource: 'focus',
			id,
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
