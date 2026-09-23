import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { mailerLiteApi } from '../common/client';
import { deleteFieldOutputSchema } from '../output-schemas';

export const deleteFieldAction = createAction({
	auth: mailerLiteAuth,
	name: 'delete_field',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Field',
	description: 'Delete a custom field.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Permanently delete a MailerLite custom field by ID. This also removes that field\'s value from every subscriber. Cannot be undone. Get the ID from list_fields. Not idempotent: a repeat call returns a 404 error.',
		idempotent: false,
	},
	outputSchema: deleteFieldOutputSchema,
	props: {
		field_id: Property.ShortText({
			displayName: 'Field ID',
			description: 'The custom field ID, from list_fields.',
			required: true,
		}),
	},
	async run(context) {
		const id = mailerLiteApi.requireId({ value: context.propsValue.field_id, label: 'Field ID' });
		await mailerLiteApi.request<unknown>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.DELETE,
			path: `/fields/${id}`,
			resource: `field ${id}`,
		});
		return { deleted: true, field_id: context.propsValue.field_id.trim() };
	},
});
