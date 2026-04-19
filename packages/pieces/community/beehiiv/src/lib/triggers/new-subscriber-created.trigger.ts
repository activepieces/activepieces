import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { publicationId } from '../common/props';
import { beehiivAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { beehiivApiCall, WebhookPayload } from '../common/client';
import { isNil } from '@activepieces/shared';

const TRIGGER_KEY = 'new-subscriber-created-trigger';

export const newSubscriberCreatedTrigger = createTrigger({
	auth: beehiivAuth,
	name: 'beehiiv_new_subscriber_created',
	displayName: 'New Subscriber Created',
	description: 'Triggers when a new subscriber is created (before email confirmation).',
	props: {
		publicationId: publicationId,
	},
	type: TriggerStrategy.WEBHOOK,
	async onEnable(context) {
		const { publicationId } = context.propsValue;

		const response = await beehiivApiCall<{ data: { id: string } }>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: `/publications/${publicationId}/webhooks`,
			body: {
				url: context.webhookUrl,
				event_types: ['subscription.created'],
			},
		});

		await context.store.put<string>(TRIGGER_KEY, response.data.id);
	},
	async onDisable(context) {
		const { publicationId } = context.propsValue;

		const webhookId = await context.store.get<string>(TRIGGER_KEY);
		if (!isNil(webhookId)) {
			await beehiivApiCall({
				apiKey: context.auth.secret_text,
				method: HttpMethod.DELETE,
				resourceUri: `/publications/${publicationId}/webhooks/${webhookId}`,
			});
		}
	},
	async test(context) {
		const { publicationId } = context.propsValue;

		const response = await beehiivApiCall<{ data: Record<string, unknown>[] }>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/publications/${publicationId}/subscriptions`,
			query: {
				status: 'active',
				limit: 5,
				page: 1,
				order_by: 'created',
				direction: 'desc',
			},
		});

		if (isNil(response.data) || response.data.length === 0) return [];

		return response.data;
	},
	async run(context) {
		const payload = context.payload.body as WebhookPayload;
		return [payload.data];
	},
	sampleData: {
		created: 1666800076,
		email: 'example@example.com',
		id: 'sub_00000000-0000-0000-0000-000000000000',
		referral_code: 'ABC123',
		referring_site: 'https://www.blog.com',
		status: 'validating',
		subscription_tier: 'free',
		subscription_premium_tier_names: [],
		utm_campaign: '',
		utm_channel: '',
		utm_medium: '',
		utm_source: '',
	},
});
