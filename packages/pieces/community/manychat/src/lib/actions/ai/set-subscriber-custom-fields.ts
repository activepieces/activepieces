import { createAction, Property } from '@activepieces/pieces-framework';
import { manychatAuth } from '../../auth';
import { manychatClient, manychatUtils } from '../../common/client';
import { manychatData, manychatInput, manychatProps } from '../../common/props';
import { aiInput } from '../../common/ai-props';
import { manychatOutputSchemas } from '../../common/output-schemas';

export const setSubscriberCustomFieldsAiAction = createAction({
	auth: manychatAuth,
	name: 'set_subscriber_custom_fields',
	classification: 'WRITE',
	displayName: 'Set Subscriber Custom Fields',
	description: 'Sets 1 to 20 custom field values on a subscriber in one call.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Sets 1 to 20 custom field values on one ManyChat subscriber by subscriber ID; each item names the field by ID or exact name (from "List Custom Fields") and gives the value. Values are checked against the field type: text, number, boolean (true/false), date (YYYY-MM-DD) or datetime (ISO 8601 with offset, for example 2026-11-11T14:30:00+02:00; no offset means UTC; ManyChat reads it back in the account timezone). Values must not be empty, because the API cannot clear a field. Returns the updated subscriber and what was sent. Setting the same values again leaves the same state.',
		idempotent: true,
	},
	outputSchema: manychatOutputSchemas.setCustomFields,
	props: {
		subscriber_id: manychatProps.subscriberIdText(),
		fields: Property.Array({
			displayName: 'Fields',
			description: 'Up to 20 items. Field is a custom field ID or exact name; Value is the new value.',
			required: true,
			properties: {
				field: Property.ShortText({ displayName: 'Field', description: 'Custom field ID or exact name.', required: true }),
				value: Property.ShortText({ displayName: 'Value', required: true }),
			},
		}),
	},
	async run({ auth, propsValue }) {
		const apiKey = manychatUtils.apiKeyOf(auth);
		const id = manychatInput.subscriberIdText({ value: propsValue.subscriber_id });
		const entries = aiInput.fieldEntries({ value: propsValue.fields, label: 'Fields' });
		const available = await manychatData.listCustomFields({ apiKey });
		const updates = entries.map((entry) => {
			const field = aiInput.resolveField({ field: entry.field, fields: available });
			const name = String(field['name'] ?? field['id']);
			const type = String(field['type']);
			return {
				id: Number(field['id']),
				name,
				type,
				value: manychatInput.coerceFieldValue({ type, value: entry.value, label: `Field "${name}"` }),
			};
		});
		const duplicate = updates.find((update, index) => updates.findIndex((other) => other.id === update.id) !== index);
		if (duplicate !== undefined) {
			throw new Error(`Field "${duplicate.name}" is listed more than once.`);
		}
		await manychatClient.request({
			apiKey,
			method: 'POST',
			path: '/subscriber/setCustomFields',
			operation: 'set custom fields',
			body: {
				subscriber_id: manychatInput.apiId(id),
				fields: updates.map((update) => ({ field_id: update.id, field_value: update.value })),
			},
		});
		const subscriber = await manychatData.getSubscriber({ apiKey, subscriberId: id });
		return { subscriber, updated_fields: updates };
	},
});
