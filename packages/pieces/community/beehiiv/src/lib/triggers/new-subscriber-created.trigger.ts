import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { publicationId } from '../common/props';
import { beehiivAuth } from '../common/auth';
import { apiKeyOf, beehiivClient, pathFor } from '../common/client';
import { beehiivWebhook } from '../common/webhook';
import { beehiivOutputSchemas } from '../common/output-schemas';

const TRIGGER_KEY = 'new-subscriber-created-trigger';

export const newSubscriberCreatedTrigger = createTrigger({
	auth: beehiivAuth,
	name: 'beehiiv_new_subscriber_created',
	classification: 'READ',
	displayName: 'New Subscriber Created',
	description: 'Triggers when a new subscriber is created (before email confirmation). Also fires for subscribers added through the API, so a flow that creates subscribers from this trigger can loop. Requires a paid beehiiv plan.',
	aiMetadata: {
		description: 'Fires once per new subscription in the selected beehiiv publication (subscription.created event), before any double opt-in confirmation, emitting the subscription record. Subscribers created through the API fire it too. Retried deliveries of the same event are ignored.',
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
			eventTypes: ['subscription.created'],
			description: 'Activepieces trigger: New Subscriber Created',
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
		status: 'validating',
		subscription_tier: 'free',
		subscription_premium_tier_names: [],
		utm_campaign: '',
		utm_channel: '',
		utm_medium: '',
		utm_source: '',
	},
});
