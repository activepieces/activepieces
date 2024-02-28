import { activeCampaignAuth } from '../..';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { CreateWebhookResponse } from '../common/types';
import { WEBHOOK_SOURCES } from '../common/constants';

export const newDealTaskTrigger = createTrigger({
	auth: activeCampaignAuth,
	name: 'activecampaign_new_deal_task',
	displayName: 'New Deal Task',
	description: 'Triggers when a new deal task is created.',
	type: TriggerStrategy.WEBHOOK,
	props: {},
	async onEnable(context) {
		const client = makeClient(context.auth);
		const res = await client.subscribeWebhook({
			name: `Activepieces New Deal Task Hook`,
			url: context.webhookUrl,
			events: ['deal_task_add'],
			sources: WEBHOOK_SOURCES,
		});
		await context.store.put<CreateWebhookResponse>('activecampaign_new_deal_task', res);
	},
	async run(context) {
		return [context.payload.body];
	},
	async onDisable(context) {
		const webhook = await context.store.get<CreateWebhookResponse>('activecampaign_new_deal_task');
		if (webhook != null) {
			const client = makeClient(context.auth);
			await client.unsubscribeWebhook(webhook.webhook.id);
		}
	},
	sampleData: {
		type: 'deal_task_add',
		date_time: '2024-02-28T06:38:49-06:00',
		initiated_from: 'admin',
		initiated_by: 'admin',
		list: '0',
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
		deal: {
			id: '1',
			title: 'Test Deal updated',
			create_date: '2024-02-28 04:36:09',
			create_date_iso: '2024-02-28T04:36:09-06:00',
			orgid: '1',
			orgname: 'john wick',
			stageid: '1',
			stage_title: 'To Contact',
			pipelineid: '1',
			pipeline_title: 'Test Pipeline',
			value: '14,055.00',
			value_raw: '14055',
			currency: 'usd',
			currency_symbol: '$',
			owner: '1',
			owner_firstname: 'john',
			owner_lastname: 'wick',
			contactid: '3',
			contact_email: 'code.test@gmail.com',
			contact_firstname: 'john',
			contact_lastname: 'wick',
			status: '0',
			fields: [{ id: '1', key: 'Forecasted Close Date', value: '2024-02-08 00:00:00' }],
		},
		task: {
			id: '6',
			type_id: '1',
			title: 'TEST TASK',
			note: 'fsfssssf',
			duedate: '2024-02-28 06:38:41',
			duedate_iso: '2024-02-28T06:38:41-06:00',
			edate: '2024-02-28 06:53:41',
			edate_iso: '2024-02-28T06:53:41-06:00',
			type_title: 'Call',
		},
	},
});
