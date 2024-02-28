import { activeCampaignAuth } from '../..';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { CreateWebhookResponse } from '../common/types';
import { WEBHOOK_SOURCES } from '../common/constants';

export const newContactTaskTrigger = createTrigger({
	auth: activeCampaignAuth,
	name: 'activecampaign_new_contact_task',
	displayName: 'New Contact Task',
	description: 'Triggers when a new contact task is added.',
	type: TriggerStrategy.WEBHOOK,
	props: {},
	async onEnable(context) {
		const client = makeClient(context.auth);
		const res = await client.subscribeWebhook({
			name: `Activepieces New Contact Task Hook`,
			url: context.webhookUrl,
			events: ['contact_task_add'],
			sources: WEBHOOK_SOURCES,
		});
		await context.store.put<CreateWebhookResponse>('activecampaign_new_contact_task', res);
	},
	async run(context) {
		return [context.payload.body];
	},
	async onDisable(context) {
		const webhook = await context.store.get<CreateWebhookResponse>(
			'activecampaign_new_contact_task',
		);
		if (webhook != null) {
			const client = makeClient(context.auth);
			await client.unsubscribeWebhook(webhook.webhook.id);
		}
	},
	sampleData: {
		type: 'contact_task_add',
		date_time: '2024-02-28T07:00:57-06:00',
		initiated_from: 'admin',
		initiated_by: 'admin',
		list: '0',
		contact: {
			id: '3',
			email: 'code.test@gmail.com',
			first_name: 'John',
			last_name: 'Wick',
			phone: '',
			ip: '0.0.0.0',
			tags: '1233',
			customer_acct_name: '',
			orgname: '',
		},
		customer_acct_name: '',
		customer_acct_id: '0',
		orgname: '',
		task: {
			id: '7',
			type_id: '1',
			title: 'test task',
			note: 'Desc',
			duedate: '2024-02-28 07:00:48',
			duedate_iso: '2024-02-28T07:00:48-06:00',
			edate: '2024-02-28 07:15:48',
			edate_iso: '2024-02-28T07:15:48-06:00',
			type_title: 'Call',
		},
	},
});
