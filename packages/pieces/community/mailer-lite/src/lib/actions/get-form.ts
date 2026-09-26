import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { mailerLiteApi } from '../common/client';
import { formOutputSchema } from '../output-schemas';

export const getFormAction = createAction({
	auth: mailerLiteAuth,
	name: 'get_form',
	classification: 'READ',
	displayName: 'Get Form',
	description: 'Get a form by ID.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Get one MailerLite signup form (popup, embedded or promotion) by ID, including conversions and settings. Get the ID from list_forms. Read-only; returns a 404 error if the ID does not exist.',
		idempotent: true,
	},
	outputSchema: formOutputSchema,
	props: {
		form_id: Property.ShortText({
			displayName: 'Form ID',
			description: 'The form ID, from list_forms.',
			required: true,
		}),
	},
	async run(context) {
		const id = mailerLiteApi.requireId({ value: context.propsValue.form_id, label: 'Form ID' });
		const body = await mailerLiteApi.request<unknown>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			path: `/forms/${id}`,
			resource: `form ${id}`,
		});
		return mailerLiteApi.unwrapData(body);
	},
});
