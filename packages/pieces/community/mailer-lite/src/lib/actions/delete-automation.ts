import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { mailerLiteApi } from '../common/client';
import { deleteAutomationOutputSchema } from '../output-schemas';

export const deleteAutomationAction = createAction({
	auth: mailerLiteAuth,
	name: 'delete_automation',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Automation',
	description: 'Delete an automation.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Permanently delete a MailerLite automation by ID, including its steps; subscribers currently in it stop receiving its emails. Cannot be undone. Get the ID from list_automations. Not idempotent: a repeat call returns a 404 error.',
		idempotent: false,
	},
	outputSchema: deleteAutomationOutputSchema,
	props: {
		automation_id: Property.ShortText({
			displayName: 'Automation ID',
			description: 'The automation ID, from list_automations.',
			required: true,
		}),
	},
	async run(context) {
		const id = mailerLiteApi.requireId({ value: context.propsValue.automation_id, label: 'Automation ID' });
		await mailerLiteApi.request<unknown>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.DELETE,
			path: `/automations/${id}`,
			resource: `automation ${id}`,
		});
		return { deleted: true, automation_id: context.propsValue.automation_id.trim() };
	},
});
