import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';

import { mauticAuth } from '../auth';
import { mauticApi } from '../common/api';
import { mauticProps } from '../common/props';
import { mauticUtils } from '../common/utils';

import type { MauticWebhookInformation } from '../common/types';

const EVENT_TYPE = 'mautic.lead_channel_subscription_changed';
const STORE_KEY = 'mautic_lead_channel_subscription_changed_trigger';

export const contactChannelSubscriptionChangedTrigger = createTrigger({
	auth: mauticAuth,
	name: 'mautic_lead_channel_subscription_changed_trigger',
	classification: 'READ',
	displayName: 'Contact Channel Subscription Change',
	description: "Triggers when a contact's channel subscription status changes.",
	aiMetadata: {
		description:
			"Fires when a contact's subscription status for a communication channel (such as email) changes in Mautic — for example when they opt in or out of receiving messages. Use to react to contactability/consent changes for a channel.",
	},
	props: {
		name: mauticProps.webhookName({ required: true }),
		description: mauticProps.webhookDescription({ required: true }),
	},
	sampleData: mauticUtils.contactSampleData({ eventType: EVENT_TYPE }),
	type: TriggerStrategy.WEBHOOK,
	async onEnable(context) {
		const webhook = await mauticApi.createWebhook({
			auth: context.auth,
			name: context.propsValue.name,
			description: context.propsValue.description,
			webhookUrl: context.webhookUrl,
			eventType: EVENT_TYPE,
		});
		await context.store.put<MauticWebhookInformation>(STORE_KEY, webhook);
	},
	async onDisable(context) {
		const webhook = await context.store.get<MauticWebhookInformation>(STORE_KEY);
		if (webhook != null) {
			await mauticApi.deleteWebhook({ auth: context.auth, webhookId: webhook.hook.id });
		}
	},
	async run(context) {
		return [context.payload.body];
	},
});
