import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { mailerLiteApi } from '../common/client';
import { listWebhooksOutputSchema } from '../output-schemas';

export const listWebhooksAction = createAction({
	auth: mailerLiteAuth,
	name: 'list_webhooks',
	classification: 'SEARCH',
	displayName: 'List Webhooks',
	description: 'List the webhooks in the account.',
	audience: 'ai',
	aiMetadata: {
		description:
			'List the MailerLite webhooks in the account with their IDs, URLs, events and enabled state. Signing secrets are never returned. Webhooks created by Activepieces MailerLite triggers appear here too. Read-only.',
		idempotent: true,
	},
	outputSchema: listWebhooksOutputSchema,
	props: {},
	async run(context) {
		const body = await mailerLiteApi.request<unknown>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			path: '/webhooks',
		});
		const items = mailerLiteApi.isRecord(body) && Array.isArray(body['data']) ? body['data'] : [];
		return { ...(mailerLiteApi.isRecord(body) ? body : {}), data: items.map((item) => mailerLiteApi.withoutSecret(item)) };
	},
});
