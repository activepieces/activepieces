import { activeCampaignAuth } from '../..';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { CreateWebhookResponse } from '../common/types';
import { WEBHOOK_SOURCES } from '../common/constants';

export const newDealNoteTrigger = createTrigger({
	auth: activeCampaignAuth,
	name: 'activecampaign_new_deal_note',
	displayName: 'New Deal Note',
	description: 'Triggers when a new deal note is created.',
	type: TriggerStrategy.WEBHOOK,
	props: {},
	async onEnable(context) {
		const client = makeClient(context.auth);
		const res = await client.subscribeWebhook({
			name: `Activepieces New Deal Note Hook`,
			url: context.webhookUrl,
			events: ['deal_note_add'],
			sources: WEBHOOK_SOURCES,
		});
		await context.store.put<CreateWebhookResponse>('activecampaign_new_deal_note', res);
	},
	async run(context) {
		return [context.payload.body];
	},
	async onDisable(context) {
		const webhook = await context.store.get<CreateWebhookResponse>('activecampaign_new_deal_note');
		if (webhook != null) {
			const client = makeClient(context.auth);
			await client.unsubscribeWebhook(webhook.webhook.id);
		}
	},
	sampleData: {
		type: 'deal_note_add',
		date_time: '2024-02-28T05:58:27-06:00',
		initiated_from: 'admin',
		initiated_by: 'admin',
		list: '0',
		note: { id: '1', text: 'Tst node' },
		deal: {
			id: '1',
			title: 'Test Deal updated',
			create_date: '2024-02-28 04:36:09',
			create_date_iso: '2024-02-28T04:36:09-06:00',
			orgid: '1',
			orgname: 'John wick',
			stageid: '1',
			stage_title: 'To Contact',
			pipelineid: '1',
			pipeline_title: 'Test Pipeline',
			value: '14,055.00',
			value_raw: '14055',
			currency: 'usd',
			currency_symbol: '$',
			owner: '1',
			owner_firstname: 'John',
			owner_lastname: 'wick',
			contactid: '3',
			contact_email: 'code.test@gmail.com',
			contact_firstname: 'John',
			contact_lastname: 'wick',
			status: '0',
			fields: [{ id: '1', key: 'Forecasted Close Date', value: '2024-02-08 00:00:00' }],
		},
	},
});
