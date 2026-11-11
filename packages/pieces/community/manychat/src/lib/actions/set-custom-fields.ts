import { createAction, DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { manychatAuth } from '../auth';
import { manychatClient, manychatUtils } from '../common/client';
import { manychatData, manychatInput, subscriberId } from '../common/props';
import { manychatOutputSchemas } from '../common/output-schemas';

export const setCustomFieldAction = createAction({
	auth: manychatAuth,
	name: 'setCustomField',
	classification: 'WRITE',
	displayName: 'Set Custom Field',
	description:
		'Adds or updates a custom field value for a user and returns the updated user. ManyChat returns date-time values in the account timezone (same moment, so the day may differ).',
	audience: 'human',
	aiMetadata: {
		description:
			'Sets one custom field value on a ManyChat subscriber, then returns the updated subscriber. Date fields are sent as YYYY-MM-DD and date-time fields with an explicit UTC offset. Setting the same value again leaves the same state.',
		idempotent: true,
	},
	outputSchema: manychatOutputSchemas.subscriber,
	props: {
		subscriber_id: subscriberId,
		field_id: Property.Dropdown({
			auth: manychatAuth,
			displayName: 'Custom Field',
			refreshers: [],
			required: true,
			options: async ({ auth }) => {
				const apiKey = manychatUtils.apiKeyOf(auth);
				if (apiKey === '') {
					return { placeholder: 'Please connect your account.', disabled: true, options: [] };
				}
				try {
					const fields = await manychatData.listCustomFields({ apiKey });
					return {
						disabled: false,
						options: fields
							.filter((field) => field['type'] !== 'array')
							.map((field) => ({ label: String(field['name'] ?? field['id']), value: `${String(field['id'])}:::${String(field['type'])}` })),
					};
				} catch (error) {
					return {
						disabled: true,
						placeholder: `Could not load custom fields: ${error instanceof Error ? error.message : String(error)}`.slice(0, 300),
						options: [],
					};
				}
			},
		}),
		field_value: Property.DynamicProperties({
			auth: manychatAuth,
			displayName: 'Field Value',
			required: true,
			refreshers: ['field_id'],
			props: async ({ auth, field_id }) => {
				if (!auth || !field_id) return {};

				const fields: DynamicPropsValue = {};

				const fieldType = String(field_id).split(':::')[1];

				switch (fieldType) {
					case 'text':
						fields['value'] = Property.ShortText({
							displayName: 'Value',
							required: true,
						});
						break;
					case 'number':
						fields['value'] = Property.Number({
							displayName: 'Value',
							required: true,
						});
						break;
					case 'date':
						fields['value'] = Property.DateTime({
							displayName: 'Value',
							description: 'Sent to ManyChat as YYYY-MM-DD, using the date part exactly as given.',
							required: true,
						});
						break;
					case 'datetime':
						fields['value'] = Property.DateTime({
							displayName: 'Value',
							description: 'Sent to ManyChat with an explicit UTC offset. A value without an offset is treated as UTC.',
							required: true,
						});
						break;
					case 'boolean':
						fields['value'] = Property.Checkbox({
							displayName: 'Value',
							required: true,
						});
						break;
					default:
						break;
				}
				return fields;
			},
		}),
	},
	async run({ auth, propsValue }) {
		const apiKey = manychatUtils.apiKeyOf(auth);
		const id = manychatInput.subscriberIdText({ value: propsValue.subscriber_id, label: 'User ID' });
		const [fieldId, fieldType] = String(propsValue.field_id).split(':::');
		if (!/^\d+$/.test(fieldId ?? '')) {
			throw new Error('Select a custom field.');
		}
		const fieldValue = manychatInput.coerceFieldValue({ type: fieldType ?? '', value: propsValue.field_value['value'], label: 'Value' });
		await manychatClient.request({
			apiKey,
			method: 'POST',
			path: '/subscriber/setCustomField',
			operation: 'set custom field',
			body: { subscriber_id: manychatInput.apiId(id), field_id: Number(fieldId), field_value: fieldValue },
		});
		return manychatData.getSubscriber({ apiKey, subscriberId: id });
	},
});
