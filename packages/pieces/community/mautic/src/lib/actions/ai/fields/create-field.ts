import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticCreateFieldOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticCreateFieldAction = createAction({
	auth: mauticAuth,
	name: 'mautic_create_field',
	outputSchema: mauticCreateFieldOutputSchema,
	displayName: 'Create Field',
	description: 'Creates a Mautic field.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a custom contact or company field. Label is required. Needs an administrator account.',
		idempotent: false,
	},
	props: {
		object: Property.StaticDropdown({
			displayName: 'Object',
			required: true,
			options: {
				options: [
					{ label: 'Contact', value: 'contact' },
					{ label: 'Company', value: 'company' },
				],
			},
		}),
		label: Property.ShortText({ displayName: 'Label', required: true }),
		alias: Property.ShortText({
			displayName: 'Alias',
			description: 'Unique alias used as the field key; generated from the label when empty.',
			required: false,
		}),
		type: Property.StaticDropdown({
			displayName: 'Type',
			description: 'Defaults to text.',
			required: false,
			options: {
				options: [
					{ label: 'text', value: 'text' },
					{ label: 'textarea', value: 'textarea' },
					{ label: 'email', value: 'email' },
					{ label: 'number', value: 'number' },
					{ label: 'boolean', value: 'boolean' },
					{ label: 'select', value: 'select' },
					{ label: 'multiselect', value: 'multiselect' },
					{ label: 'date', value: 'date' },
					{ label: 'datetime', value: 'datetime' },
					{ label: 'time', value: 'time' },
					{ label: 'url', value: 'url' },
					{ label: 'tel', value: 'tel' },
					{ label: 'country', value: 'country' },
					{ label: 'region', value: 'region' },
					{ label: 'timezone', value: 'timezone' },
					{ label: 'locale', value: 'locale' },
					{ label: 'lookup', value: 'lookup' },
					{ label: 'html', value: 'html' },
				],
			},
		}),
		group: Property.StaticDropdown({
			displayName: 'Group',
			description: 'Defaults to core.',
			required: false,
			options: {
				options: [
					{ label: 'Core', value: 'core' },
					{ label: 'Social', value: 'social' },
					{ label: 'Personal', value: 'personal' },
					{ label: 'Professional', value: 'professional' },
				],
			},
		}),
		defaultValue: Property.ShortText({ displayName: 'Default Value', required: false }),
		isRequired: mauticAiProps.yesNo({ displayName: 'Required' }),
		isUniqueIdentifier: mauticAiProps.yesNo({
			displayName: 'Unique Identifier',
			description: 'Whether contacts are merged on this field.',
		}),
		isPubliclyUpdatable: mauticAiProps.yesNo({
			displayName: 'Publicly Updatable',
			description: 'Whether tracking requests and forms can set it.',
		}),
		properties: Property.Json({
			displayName: 'Properties',
			description:
				'Type settings, e.g. {"list": [{"label": "Small", "value": "s"}]} for select fields.',
			required: false,
		}),
		additionalFields: mauticAiProps.additionalFields({
			description:
				'Other field properties, e.g. "order", "description", "isVisible". The dedicated props above win over the same keys here.',
		}),
	},
	async run(context) {
		const {
			additionalFields,
			label,
			alias,
			type,
			group,
			defaultValue,
			isRequired,
			isUniqueIdentifier,
			isPubliclyUpdatable,
			properties,
		} = context.propsValue;
		return await mauticApi.createRecord({
			auth: context.auth,
			resource: `fields/${context.propsValue.object}`,
			body: {
				...additionalFields,
				...spreadIfDefined('label', label),
				...spreadIfDefined('alias', alias),
				...spreadIfDefined('type', type),
				...spreadIfDefined('group', group),
				...spreadIfDefined('defaultValue', defaultValue),
				...spreadIfDefined('isRequired', isRequired),
				...spreadIfDefined('isUniqueIdentifier', isUniqueIdentifier),
				...spreadIfDefined('isPubliclyUpdatable', isPubliclyUpdatable),
				...spreadIfDefined('properties', properties),
			},
		});
	},
});
