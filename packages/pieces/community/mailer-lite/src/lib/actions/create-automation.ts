import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { mailerLiteApi } from '../common/client';
import { createAutomationOutputSchema } from '../output-schemas';

export const createAutomationAction = createAction({
	auth: mailerLiteAuth,
	name: 'create_automation',
	classification: 'WRITE',
	displayName: 'Create Automation Draft',
	description: 'Create an empty, disabled automation draft.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Create an empty MailerLite automation draft with only a name. It is disabled and has no trigger or steps; those are configured in the MailerLite dashboard. Nothing is sent. Not idempotent: each call creates another draft.',
		idempotent: false,
	},
	outputSchema: createAutomationOutputSchema,
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'The automation name.',
			required: true,
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
			path: '/automations',
			body: { name },
		});
		return mailerLiteApi.unwrapData(body);
	},
});
