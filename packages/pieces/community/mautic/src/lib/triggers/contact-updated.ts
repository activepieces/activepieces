import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';

import { mauticAuth } from '../auth';
import { mauticApi } from '../common/api';
import { mauticProps } from '../common/props';
import { mauticUtils } from '../common/utils';

import type { MauticWebhookInformation } from '../common/types';

const EVENT_TYPE = 'mautic.lead_post_save_update';
const STORE_KEY = 'mautic_lead_post_save_update_trigger';

export const contactUpdatedTrigger = createTrigger({
	auth: mauticAuth,
	name: 'mautic_lead_post_save_update_trigger',
	classification: 'READ',
	displayName: 'Contact Updated',
	description: 'Triggers when a contact is updated.',
	aiMetadata: {
		description:
			"Fires when an existing contact (lead) in Mautic is saved after being modified, representing a change to that contact's field values. Use to react to edits on already-existing contacts; for newly created contacts use the New Contact trigger.",
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
