import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { publicationId } from '../common/props';
import { beehiivAuth } from '../common/auth';
import { apiKeyOf, beehiivClient, pathFor } from '../common/client';
import { beehiivWebhook } from '../common/webhook';
import { beehiivOutputSchemas } from '../common/output-schemas';

const TRIGGER_KEY = 'new-subscription-confirmed-trigger';

export const newSubscriptionConfirmedTrigger = createTrigger({
	auth: beehiivAuth,
	name: 'beehiiv_new_subscription_confirmed',
	classification: 'READ',
	displayName: 'New Subscription Confirmation',
	description: 'Triggers when a new subscriber confirms their subscription. Requires a paid beehiiv plan.',
	aiMetadata: {
		description: 'Fires once per subscription confirmed in the selected beehiiv publication (subscription.confirmed event), after any double opt-in step, emitting the confirmed subscription record. Retried deliveries of the same event are ignored.',
	},
	props: {
		publicationId: publicationId,
	},
	outputSchema: beehiivOutputSchemas.subscriptionPayload,
	type: TriggerStrategy.WEBHOOK,
	async onEnable(context) {
		await beehiivWebhook.enable({
			auth: context.auth,
			publicationId: context.propsValue.publicationId,
			webhookUrl: context.webhookUrl,
			eventTypes: ['subscription.confirmed'],
			description: 'Activepieces trigger: New Subscription Confirmation',
			store: context.store,
			storeKey: TRIGGER_KEY,
		});
	},
	async onDisable(context) {
		await beehiivWebhook.disable({
			auth: context.auth,
			publicationId: context.propsValue.publicationId,
			store: context.store,
			storeKey: TRIGGER_KEY,
		});
	},
	async test(context) {
		const page = await beehiivClient.listCursorPage<Record<string, unknown>>({
			apiKey: apiKeyOf(context.auth),
			path: `${pathFor(['publications', context.propsValue.publicationId])}/subscriptions`,
			operation: 'list subscriptions',
			query: { status: 'active', order_by: 'created', direction: 'desc' },
			limit: 5,
		});
		return page.items;
	},
	async run(context) {
		return beehiivWebhook.eventsFrom({
			body: context.payload.body,
			headers: context.payload.headers,
			store: context.store,
			storeKey: TRIGGER_KEY,
		});
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
