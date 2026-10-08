import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';

import { mauticAuth } from '../auth';
import { mauticApi } from '../common/api';
import { mauticProps } from '../common/props';
import { mauticUtils } from '../common/utils';

import type { MauticWebhookInformation } from '../common/types';

const EVENT_TYPE = 'mautic.lead_company_change';
const STORE_KEY = 'mautic_lead_company_change_trigger';

export const contactCompanyChangedTrigger = createTrigger({
	auth: mauticAuth,
	name: 'mautic_lead_company_change_trigger',
	classification: 'READ',
	displayName: 'Contact Company Subscription Change',
	description: 'Triggers when a commpany is added or removed to/from contact.',
	aiMetadata: {
		description:
			"Fires when a contact's company association changes in Mautic — that is, when the contact is added to or removed from a company. Use to react to a contact's organization membership changing.",
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
