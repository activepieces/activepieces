import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { mailerLiteApi } from '../common/client';
import { webhookOutputSchema } from '../output-schemas';

export const createWebhookAction = createAction({
	auth: mailerLiteAuth,
	name: 'create_webhook',
	classification: 'WRITE',
	displayName: 'Create Webhook',
	description: 'Create a webhook that posts MailerLite events to a URL.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Create a MailerLite webhook that POSTs the chosen events (for example subscriber.created) to a URL. The signing secret is never returned. Optionally set enabled and batchable. Not idempotent: each call creates another webhook, so check list_webhooks first.',
		idempotent: false,
	},
	outputSchema: webhookOutputSchema,
	props: {
		url: Property.ShortText({
			displayName: 'URL',
			description: 'The HTTPS URL MailerLite will POST events to.',
			required: true,
		}),
		events: Property.StaticMultiSelectDropdown({
			displayName: 'Events',
			description: 'The events that trigger the webhook.',
			required: true,
			options: { options: mailerLiteApi.webhookEventOptions() },
		}),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'A name for the webhook.',
			required: false,
		}),
		enabled: Property.StaticDropdown({
			displayName: 'Enabled',
			description: 'Whether the webhook is active. MailerLite defaults to enabled.',
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
		const { url, events, name, enabled, batchable } = context.propsValue;
		if (!url.trim()) {
			throw new Error('URL is required.');
		}
		if (!events || events.length === 0) {
			throw new Error('Select at least one event.');
		}
		const body: Record<string, unknown> = { url: url.trim(), events };
		if (name) {
			body['name'] = name;
		}
		if (enabled === 'true' || enabled === 'false') {
			body['enabled'] = enabled === 'true';
		}
		if (batchable === 'true' || batchable === 'false') {
			body['batchable'] = batchable === 'true';
		}
		const response = await mailerLiteApi.request<unknown>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.POST,
			path: '/webhooks',
			body,
		});
		return mailerLiteApi.withoutSecret(mailerLiteApi.unwrapData(response));
	},
});
