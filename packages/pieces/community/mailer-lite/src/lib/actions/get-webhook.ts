import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { mailerLiteApi } from '../common/client';
import { webhookOutputSchema } from '../output-schemas';

export const getWebhookAction = createAction({
	auth: mailerLiteAuth,
	name: 'get_webhook',
	classification: 'READ',
	displayName: 'Get Webhook',
	description: 'Get a webhook by ID.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Get one MailerLite webhook by ID: name, URL, subscribed events, enabled and batchable flags. The signing secret is never returned. Get the ID from list_webhooks. Read-only; returns a 404 error if the ID does not exist.',
		idempotent: true,
	},
	outputSchema: webhookOutputSchema,
	props: {
		webhook_id: Property.ShortText({
			displayName: 'Webhook ID',
			description: 'The webhook ID, from list_webhooks.',
			required: true,
		}),
	},
	async run(context) {
		const id = mailerLiteApi.requireId({ value: context.propsValue.webhook_id, label: 'Webhook ID' });
		const body = await mailerLiteApi.request<unknown>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			path: `/webhooks/${id}`,
			resource: `webhook ${id}`,
		});
		return mailerLiteApi.withoutSecret(mailerLiteApi.unwrapData(body));
	},
});
