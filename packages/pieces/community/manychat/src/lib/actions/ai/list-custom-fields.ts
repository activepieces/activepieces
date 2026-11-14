import { createAction, Property } from '@activepieces/pieces-framework';
import { manychatAuth } from '../../auth';
import { manychatUtils } from '../../common/client';
import { manychatData } from '../../common/props';
import { aiInput, CUSTOM_FIELD_TYPES } from '../../common/ai-props';
import { manychatOutputSchemas } from '../../common/output-schemas';

export const listCustomFieldsAiAction = createAction({
	auth: manychatAuth,
	name: 'list_custom_fields',
	classification: 'SEARCH',
	displayName: 'List Custom Fields',
	description: 'Lists every subscriber custom field in the ManyChat account.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists every subscriber custom field in the ManyChat account with its ID, name, type and description, optionally only one type. Use it to pick field IDs or names for "Set Subscriber Custom Fields" and "Find User by Custom Field", and to learn each field type before writing a value. Read-only.',
		idempotent: true,
	},
	outputSchema: manychatOutputSchemas.listCustomFields,
	props: {
		type: Property.ShortText({
			displayName: 'Type',
			description: `Only fields of this type: ${CUSTOM_FIELD_TYPES.join(', ')}. Leave empty for all.`,
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const type = aiInput.oneOf({ value: propsValue.type, label: 'Type', allowed: CUSTOM_FIELD_TYPES });
		const fields = await manychatData.listCustomFields({ apiKey: manychatUtils.apiKeyOf(auth) });
		const customFields = fields.filter((field) => type === undefined || field['type'] === type);
		return { custom_fields: customFields, count: customFields.length };
	},
});
