import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { mailerLiteApi } from '../common/client';
import { deleteWebhookOutputSchema } from '../output-schemas';

export const deleteWebhookAction = createAction({
	auth: mailerLiteAuth,
	name: 'delete_webhook',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Webhook',
	description: 'Delete a webhook.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Permanently delete a MailerLite webhook by ID. Warning: webhooks created by Activepieces MailerLite triggers are listed too, and deleting one silently breaks that flow. Get the ID from list_webhooks. Not idempotent: a repeat call returns a 404 error.',
		idempotent: false,
	},
	outputSchema: deleteWebhookOutputSchema,
	props: {
		webhook_id: Property.ShortText({
			displayName: 'Webhook ID',
			description: 'The webhook ID, from list_webhooks.',
			required: true,
		}),
	},
	async run(context) {
		const id = mailerLiteApi.requireId({ value: context.propsValue.webhook_id, label: 'Webhook ID' });
		await mailerLiteApi.request<unknown>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.DELETE,
			path: `/webhooks/${id}`,
			resource: `webhook ${id}`,
		});
		return { deleted: true, webhook_id: context.propsValue.webhook_id.trim() };
	},
});
