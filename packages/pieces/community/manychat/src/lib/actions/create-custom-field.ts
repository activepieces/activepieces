import { createAction, Property } from '@activepieces/pieces-framework';
import { manychatAuth } from '../auth';
import { manychatClient, manychatUtils } from '../common/client';
import { manychatInput, SETTABLE_FIELD_TYPES } from '../common/props';
import { aiInput } from '../common/ai-props';
import { manychatOutputSchemas } from '../common/output-schemas';

export const createCustomFieldAction = createAction({
	auth: manychatAuth,
	name: 'create_custom_field',
	classification: 'WRITE',
	displayName: 'Create Custom Field',
	description: 'Creates a new subscriber custom field in the ManyChat account.',
	audience: 'both',
	aiMetadata: {
		description:
			'Creates a new subscriber custom field (text, number, date, datetime or boolean) and returns its ID, name and type. Check "List Custom Fields" first, since the field may already exist; then write values with "Set Subscriber Custom Fields". Each call tries to create another field.',
		idempotent: false,
	},
	outputSchema: manychatOutputSchemas.customField,
	props: {
		caption: Property.ShortText({
			displayName: 'Field Name',
			required: true,
		}),
		type: Property.StaticDropdown<string>({
			displayName: 'Type',
			required: true,
			options: {
				options: SETTABLE_FIELD_TYPES.map((value) => ({ label: value, value })),
			},
		}),
		description: Property.ShortText({
			displayName: 'Description',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const caption = aiInput.requireText({ value: propsValue.caption, label: 'Field Name' });
		const type = aiInput.oneOf({ value: propsValue.type, label: 'Type', allowed: SETTABLE_FIELD_TYPES });
		if (type === undefined) {
			throw new Error('Type is required.');
		}
		const body = await manychatClient.request({
			apiKey: manychatUtils.apiKeyOf(auth),
			method: 'POST',
			path: '/page/createCustomField',
			operation: 'create custom field',
			body: { caption, type, description: manychatInput.optionalText(propsValue.description) },
		});
		const data = manychatUtils.dataOf(body);
		const field = manychatUtils.isRecord(data) ? data['field'] : undefined;
		if (!manychatUtils.isRecord(field)) {
			throw new Error('ManyChat accepted the custom field but returned no field details.');
		}
		return field;
	},
});
