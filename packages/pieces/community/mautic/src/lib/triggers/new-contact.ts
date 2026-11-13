import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';

import { mauticAuth } from '../auth';
import { mauticApi } from '../common/api';
import { mauticProps } from '../common/props';
import { mauticUtils } from '../common/utils';
import { mauticLeadPostSaveNewTriggerOutputSchema } from '../output-schemas';

import type { MauticWebhookInformation } from '../common/types';

const EVENT_TYPE = 'mautic.lead_post_save_new';
const STORE_KEY = 'mautic_lead_post_save_new_trigger';

export const newContactTrigger = createTrigger({
	auth: mauticAuth,
	name: 'mautic_lead_post_save_new_trigger',
	outputSchema: mauticLeadPostSaveNewTriggerOutputSchema,
	classification: 'READ',
	displayName: 'New Contact',
	description: 'Triggers when a new contact is created.',
	aiMetadata: {
		description:
			'Fires when a new contact (lead) is created in Mautic, representing a freshly added person. Use to react to contact creation; for changes to existing contacts use the Contact Updated trigger.',
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
