import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { mailerLiteApi } from '../common/client';
import { automationOutputSchema } from '../output-schemas';

export const getAutomationAction = createAction({
	auth: mailerLiteAuth,
	name: 'get_automation',
	classification: 'READ',
	displayName: 'Get Automation',
	description: 'Get an automation by ID.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Get one MailerLite automation by ID, including its enabled state, trigger configuration, steps and stats. Get the ID from list_automations. Read-only; returns a 404 error if the ID does not exist.',
		idempotent: true,
	},
	outputSchema: automationOutputSchema,
	props: {
		automation_id: Property.ShortText({
			displayName: 'Automation ID',
			description: 'The automation ID, from list_automations.',
			required: true,
		}),
	},
	async run(context) {
		const id = mailerLiteApi.requireId({ value: context.propsValue.automation_id, label: 'Automation ID' });
		const body = await mailerLiteApi.request<unknown>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			path: `/automations/${id}`,
			resource: `automation ${id}`,
		});
		return mailerLiteApi.unwrapData(body);
	},
});
