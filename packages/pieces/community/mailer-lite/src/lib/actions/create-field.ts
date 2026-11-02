import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { mailerLiteApi } from '../common/client';
import { fieldOutputSchema } from '../output-schemas';

export const createFieldAction = createAction({
	auth: mailerLiteAuth,
	name: 'create_field',
	classification: 'WRITE',
	displayName: 'Create Field',
	description: 'Create a custom subscriber field.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Create a MailerLite custom subscriber field with a name and type (text, number or date). The type cannot be changed later. Returns the field with its key, which is what goes into a subscriber\'s fields object. Check list_fields first: not idempotent, and a duplicate name returns a validation error.',
		idempotent: false,
	},
	outputSchema: fieldOutputSchema,
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'The field name.',
			required: true,
		}),
		type: Property.StaticDropdown({
			displayName: 'Type',
			description: 'The field type. It cannot be changed later.',
			required: true,
			options: {
				options: [
					{ label: 'Text', value: 'text' },
					{ label: 'Number', value: 'number' },
					{ label: 'Date', value: 'date' },
				],
			},
		}),
	},
	async run(context) {
		const name = context.propsValue.name.trim();
		if (!name) {
			throw new Error('Name is required.');
		}
		const body = await mailerLiteApi.request<unknown>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.POST,
			path: '/fields',
			body: { name, type: context.propsValue.type },
		});
		return mailerLiteApi.unwrapData(body);
	},
});
