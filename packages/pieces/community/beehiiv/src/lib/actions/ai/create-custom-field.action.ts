import { Property, createAction } from '@activepieces/pieces-framework';
import { beehiivAuth } from '../../common/auth';
import { apiKeyOf, beehiivClient, pathFor } from '../../common/client';
import { CUSTOM_FIELD_KINDS, aiInput, aiProps } from '../../common/ai-props';
import { beehiivOutputSchemas } from '../../common/output-schemas';

export const createCustomFieldAiAction = createAction({
	auth: beehiivAuth,
	name: 'create_custom_field',
	classification: 'WRITE',
	displayName: 'Create Custom Field',
	description: 'Creates a custom subscriber field in a publication.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates a new custom subscriber field (name and kind) in a beehiiv publication so subscriptions can store it. Check "List Custom Fields" first: each call creates a field, so a repeat can create a duplicate or fail on the existing name.',
		idempotent: false,
	},
	outputSchema: beehiivOutputSchemas.createCustomField,
	props: {
		publication_id: aiProps.publicationId(),
		name: Property.ShortText({ displayName: 'Name', description: 'The field name shown in beehiiv, for example "Company".', required: true }),
		kind: Property.StaticDropdown<string>({
			displayName: 'Kind',
			description: 'The value type of the field.',
			required: true,
			options: { options: CUSTOM_FIELD_KINDS.map((value) => ({ label: value, value })) },
		}),
	},
	async run({ auth, propsValue }) {
		const publicationId = aiInput.requireText({ value: propsValue.publication_id, label: 'Publication ID' });
		const kind = aiInput.oneOf({ value: propsValue.kind, label: 'Kind', allowed: CUSTOM_FIELD_KINDS });
		if (kind === undefined) {
			throw new Error('Kind is required.');
		}
		const response = await beehiivClient.request({
			apiKey: apiKeyOf(auth),
			method: 'POST',
			path: pathFor(['publications', publicationId, 'custom_fields']),
			operation: 'create custom field',
			body: { display: aiInput.requireText({ value: propsValue.name, label: 'Name' }), kind },
		});
		return aiInput.dataOf(response.body);
	},
});
