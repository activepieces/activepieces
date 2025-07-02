import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioApiCall, verifyWebhookSignature } from '../common/client';
import { attioAuth } from '../../index';
import { listIdDropdown } from '../common/props';
import { ListWebhookPayload, WebhookResponse } from '../common/types';
import { isNil } from '@activepieces/shared';

const TRIGGER_KEY = 'new-list-entry-trigger';

export const listEntryCreatedTrigger = createTrigger({
	name: 'list_entry_created',
	displayName: 'List Entry Created',
	description: 'Triggers when a new entry is added.',
	auth: attioAuth,
	props: {
		listId: listIdDropdown({
			displayName: 'List',
			required: true,
		}),
	},
	type: TriggerStrategy.WEBHOOK,
	sampleData: {},
	async onEnable(context) {
		const response = await attioApiCall<{ data: WebhookResponse }>({
			accessToken: context.auth,
			method: HttpMethod.POST,
			resourceUri: '/webhooks',
			body: {
				data: {
					target_url: context.webhookUrl,
					subscriptions: [
						{
							event_type: 'list-entry.created',
							filter: {
								$and: [
									{
										field: 'id.list_id',
										operator: 'equals',
										value: context.propsValue.listId,
									},
								],
							},
						},
					],
				},
			},
		});

		await context.store.put<{ webhookId: string; WebhookSecret: string }>(TRIGGER_KEY, {
			webhookId: response.data.id.webhook_id,
			WebhookSecret: response.data.secret,
		});
	},
	async onDisable(context) {
		const webhookData = await context.store.get<{ webhookId: string; WebhookSecret: string }>(
			TRIGGER_KEY,
		);
		if (!isNil(webhookData) && webhookData.webhookId) {
			await attioApiCall({
				accessToken: context.auth,
				method: HttpMethod.DELETE,
				resourceUri: `/webhooks/${webhookData.webhookId}`,
			});
		}
	},
	async test(context) {
		const response = await attioApiCall<{ data: Array<Record<string, any>> }>({
			accessToken: context.auth,
			method: HttpMethod.POST,
			resourceUri: `/lists/${context.propsValue.listId}/entries/query`,
			body: {
				limit: 5,
				offset: 0,
			},
		});

		return response.data;
	},
	async run(context) {
		const triggerData = await context.store.get<{ webhookId: string; WebhookSecret: string }>(
			TRIGGER_KEY,
		);

		const webhookSecret = triggerData?.WebhookSecret;
		const webhookSignatureHeader = context.payload.headers['attio-signature'];
		const rawBody = context.payload.rawBody;

		if (!verifyWebhookSignature(webhookSecret, webhookSignatureHeader, rawBody)) {
			return [];
		}

		const payload = context.payload.body as ListWebhookPayload;
		const entryId = payload.events[0].id.entry_id;

		const response = await attioApiCall<{ data: Record<string, any> }>({
			accessToken: context.auth,
			method: HttpMethod.GET,
			resourceUri: `/lists/${context.propsValue.listId}/entries/${entryId}`,
		});
		return [response.data];
	},
});
