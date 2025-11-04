import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { publicationId } from '../common/props';
import { beehiivAuth } from '../common/auth';
import { beehiivApiCall, WebhookPayload } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';

const TRIGGER_KEY = 'user-unsubscribes-trigger';

export const userUnsubscribesTrigger = createTrigger({
	auth: beehiivAuth,
	name: 'beehiiv_user_unsubscribes',
	displayName: 'User Unsubscribes',
	description: 'Triggers when a user unsubscribes.',
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
				event_types: ['subscription.deleted'],
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
