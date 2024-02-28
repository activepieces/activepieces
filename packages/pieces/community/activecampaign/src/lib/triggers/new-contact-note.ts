import { activeCampaignAuth } from '../..';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { CreateWebhookResponse } from '../common/types';
import { WEBHOOK_SOURCES } from '../common/constants';

export const newContactNoteTrigger = createTrigger({
	auth: activeCampaignAuth,
	name: 'activecampaign_new_contact_note',
	displayName: 'New Contact Note',
	description: 'Triggers when a new contact note is added.',
	type: TriggerStrategy.WEBHOOK,
	props: {},
	async onEnable(context) {
		const client = makeClient(context.auth);
		const res = await client.subscribeWebhook({
			name: `Activepieces New Contact Note Hook`,
			url: context.webhookUrl,
			events: ['subscriber_note'],
			sources: WEBHOOK_SOURCES,
		});
		await context.store.put<CreateWebhookResponse>('activecampaign_new_contact_note', res);
	},
	async run(context) {
		return [context.payload.body];
	},
	async onDisable(context) {
		const webhook = await context.store.get<CreateWebhookResponse>(
			'activecampaign_new_contact_note',
		);
		if (webhook != null) {
			const client = makeClient(context.auth);
			await client.unsubscribeWebhook(webhook.webhook.id);
		}
	},
	sampleData: {
		type: 'subscriber_note',
		date_time: '2024-02-28T06:58:11-06:00',
		initiated_from: 'admin',
		initiated_by: 'admin',
		list: '0',
		note: 'test note',
		contact: {
			id: '3',
			email: 'code.test@gmail.com',
			first_name: 'john',
			last_name: 'wick',
			phone: '',
			ip: '0.0.0.0',
			tags: '1233',
			customer_acct_name: '',
			orgname: '',
		},
		customer_acct_name: '',
		customer_acct_id: '0',
		orgname: '',
	},
});
