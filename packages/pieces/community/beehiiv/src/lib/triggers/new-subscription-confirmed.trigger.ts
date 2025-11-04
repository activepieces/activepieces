import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { publicationId } from '../common/props';
import { beehiivAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { beehiivApiCall, WebhookPayload } from '../common/client';
import { isNil } from '@activepieces/shared';

const TRIGGER_KEY = 'new-subscription-confirmed-trigger';

export const newSubscriptionConfirmedTrigger = createTrigger({
	auth: beehiivAuth,
	name: 'beehiiv_new_subscription_confirmed',
	displayName: 'New Subscription Confirmation',
	description: 'Triggers when a new subscriber confirms their subscription.',
	props: {
		publicationId: publicationId,
	},
	type: TriggerStrategy.WEBHOOK,
	async onEnable(context) {
		const { publicationId } = context.propsValue;

		const response = await beehiivApiCall<{ data: { id: string } }>({
			apiKey: context.auth,
			method: HttpMethod.POST,
			resourceUri: `/publications/${publicationId}/webhooks`,
			body: {
				url: context.webhookUrl,
				event_types: ['subscription.confirmed'],
			},
		});

		await context.store.put<string>(TRIGGER_KEY, response.data.id);
	},
	async onDisable(context) {
		const { publicationId } = context.propsValue;

		const webhookId = await context.store.get<string>(TRIGGER_KEY);
		if (!isNil(webhookId)) {
			await beehiivApiCall({
				apiKey: context.auth,
				method: HttpMethod.DELETE,
				resourceUri: `/publications/${publicationId}/webhooks/${webhookId}`,
			});
		}
	},
	async test(context) {
		const { publicationId } = context.propsValue;

		const response = await beehiivApiCall<{ data: Record<string, any>[] }>({
			apiKey: context.auth,
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

		if (isNil(response.data) || response.data.length == 0) return [];

		return response.data;
	},
	async run(context) {
		const payload = context.payload.body as WebhookPayload;
		return [payload];
	},
	sampleData: {
		created: 1666800076,
		email: 'example@example.com',
		id: 'sub_00000000-0000-0000-0000-000000000000',
		referral_code: 'ABC123',
		referring_site: 'https://www.blog.com',
		status: 'active',
		subscription_tier: 'premium',
		subscription_premium_tier_names: ['Premium', 'Pro'],
		stripe_customer_id: 'cus_00000000000000',
		utm_campaign: 'Q1 Campaign',
		utm_channel: 'website',
		utm_medium: 'organic',
		utm_source: 'Twitter',
	},
});
