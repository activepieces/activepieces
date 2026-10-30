import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomAuth } from '../auth';
import { intercomRequest } from '../common';
import { listDataAttributesOutputSchema } from '../output-schemas';

export const listDataAttributesAction = createAction({
	auth: intercomAuth,
	name: 'list_data_attributes',
	classification: 'SEARCH',
	displayName: 'List Data Attributes',
	description: 'Lists the standard and custom attributes for contacts, companies or conversations.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists the data attributes (standard and custom) for contacts, companies or conversations, with name, label, data type, options and whether the API can write them. Use to learn custom attribute names before Search Contacts or Update Contact. Read-only.',
		idempotent: true,
	},
	props: {
		model: Property.StaticDropdown({
			displayName: 'Object',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Contact', value: 'contact' },
					{ label: 'Company', value: 'company' },
					{ label: 'Conversation', value: 'conversation' },
				],
			},
		}),
		includeArchived: Property.Checkbox({
			displayName: 'Include Archived',
			required: false,
			defaultValue: false,
		}),
	},
	outputSchema: listDataAttributesOutputSchema,
	async run(context) {
		const body = await intercomRequest<{ data?: Array<Record<string, unknown>> }>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: ['data_attributes'],
			query: {
				model: context.propsValue.model || undefined,
				include_archived: context.propsValue.includeArchived === true ? true : undefined,
			},
			operation: 'list data attributes',
		});
		return {
			items: (body.data ?? []).map((attribute) => ({
				name: attribute['name'],
				full_name: attribute['full_name'] ?? null,
				label: attribute['label'] ?? null,
				data_type: attribute['data_type'] ?? null,
				model: attribute['model'] ?? null,
				custom: attribute['custom'] === true,
				api_writable: attribute['api_writable'] === true,
				options: Array.isArray(attribute['options']) ? attribute['options'] : [],
			})),
		};
	},
});
