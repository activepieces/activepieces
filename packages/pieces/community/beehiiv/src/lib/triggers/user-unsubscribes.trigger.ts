import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { publicationId } from '../common/props';
import { beehiivAuth } from '../common/auth';
import { apiKeyOf, beehiivClient, pathFor } from '../common/client';
import { beehiivWebhook } from '../common/webhook';
import { beehiivOutputSchemas } from '../common/output-schemas';

const TRIGGER_KEY = 'user-unsubscribes-trigger';

export const userUnsubscribesTrigger = createTrigger({
	auth: beehiivAuth,
	name: 'beehiiv_user_unsubscribes',
	classification: 'READ',
	displayName: 'User Unsubscribes',
	description: 'Triggers when a subscriber unsubscribes or is deleted from the publication (Unsubscribe Source is empty for deletions). Requires a paid beehiiv plan.',
	aiMetadata: {
		description: 'Fires once per subscription that is unsubscribed or deleted in the selected beehiiv publication (subscription.deleted event), emitting the subscription with unsubscribed_at and unsubscribe_source; unsubscribe_source is empty when it was a deletion. Retried deliveries of the same event are ignored.',
	},
	props: {
		publicationId: publicationId,
	},
	outputSchema: beehiivOutputSchemas.unsubscribePayload,
	type: TriggerStrategy.WEBHOOK,
	async onEnable(context) {
		await beehiivWebhook.enable({
			auth: context.auth,
			publicationId: context.propsValue.publicationId,
			webhookUrl: context.webhookUrl,
			eventTypes: ['subscription.deleted'],
			description: 'Activepieces trigger: User Unsubscribes',
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
			query: { status: 'inactive', order_by: 'created', direction: 'desc' },
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
