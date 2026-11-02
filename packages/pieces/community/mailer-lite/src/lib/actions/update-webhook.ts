import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { mailerLiteApi } from '../common/client';
import { webhookOutputSchema } from '../output-schemas';

export const updateWebhookAction = createAction({
	auth: mailerLiteAuth,
	name: 'update_webhook',
	classification: 'WRITE',
	displayName: 'Update Webhook',
	description: 'Update a webhook, changing only the values you supply.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Update a MailerLite webhook by ID, sending only the values you supply (name, URL, events, enabled, batchable); the rest are kept. A supplied events list replaces the current one. The signing secret is never returned. Get the ID from list_webhooks. Webhooks created by Activepieces MailerLite triggers are listed too; changing one can break that flow. At least one value is required. Idempotent.',
		idempotent: true,
	},
	outputSchema: webhookOutputSchema,
	props: {
		webhook_id: Property.ShortText({
			displayName: 'Webhook ID',
			description: 'The webhook ID, from list_webhooks.',
			required: true,
		}),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'New webhook name.',
			required: false,
		}),
		url: Property.ShortText({
			displayName: 'URL',
			description: 'New HTTPS URL MailerLite will POST events to.',
			required: false,
		}),
		events: Property.StaticMultiSelectDropdown({
			displayName: 'Events',
			description: 'Replaces the events that trigger the webhook.',
			required: false,
			options: { options: mailerLiteApi.webhookEventOptions() },
		}),
		enabled: Property.StaticDropdown({
			displayName: 'Enabled',
			description: 'Whether the webhook is active.',
			required: false,
			options: { options: mailerLiteApi.booleanOptions() },
		}),
		batchable: Property.StaticDropdown({
			displayName: 'Batchable',
			description: 'Whether events are delivered in batches.',
			required: false,
			options: { options: mailerLiteApi.booleanOptions() },
		}),
	},
	async run(context) {
		const id = mailerLiteApi.requireId({ value: context.propsValue.webhook_id, label: 'Webhook ID' });
		const { name, url, events, enabled, batchable } = context.propsValue;
		const body: Record<string, unknown> = {};
		if (name) {
			body['name'] = name;
		}
		if (url && url.trim()) {
			body['url'] = url.trim();
		}
		if (events && events.length > 0) {
			body['events'] = events;
		}
		if (enabled === 'true' || enabled === 'false') {
			body['enabled'] = enabled === 'true';
		}
		if (batchable === 'true' || batchable === 'false') {
			body['batchable'] = batchable === 'true';
		}
		if (Object.keys(body).length === 0) {
			throw new Error('Provide at least one value to update.');
		}
		const response = await mailerLiteApi.request<unknown>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.PUT,
			path: `/webhooks/${id}`,
			resource: `webhook ${id}`,
			body,
		});
		return mailerLiteApi.withoutSecret(mailerLiteApi.unwrapData(response));
	},
});
