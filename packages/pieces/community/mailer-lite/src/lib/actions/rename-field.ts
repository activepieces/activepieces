import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { mailerLiteApi } from '../common/client';
import { fieldOutputSchema } from '../output-schemas';

export const renameFieldAction = createAction({
	auth: mailerLiteAuth,
	name: 'rename_field',
	classification: 'WRITE',
	displayName: 'Rename Field',
	description: 'Rename a custom field.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Rename a MailerLite custom field by ID. The field type cannot be changed and subscriber values are kept. Get the ID from list_fields. Idempotent.',
		idempotent: true,
	},
	outputSchema: fieldOutputSchema,
	props: {
		field_id: Property.ShortText({
			displayName: 'Field ID',
			description: 'The custom field ID, from list_fields.',
			required: true,
		}),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'The new field name.',
			required: true,
		}),
	},
	async run(context) {
		const id = mailerLiteApi.requireId({ value: context.propsValue.field_id, label: 'Field ID' });
		const name = context.propsValue.name.trim();
		if (!name) {
			throw new Error('Name is required.');
		}
		const body = await mailerLiteApi.request<unknown>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.PUT,
			path: `/fields/${id}`,
			resource: `field ${id}`,
			body: { name },
		});
		return mailerLiteApi.unwrapData(body);
	},
});
