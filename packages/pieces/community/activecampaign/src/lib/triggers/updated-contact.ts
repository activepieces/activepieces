import { activeCampaignAuth } from '../..';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { CreateWebhookResponse } from '../common/types';
import { WEBHOOK_SOURCES } from '../common/constants';

export const updatedContactTrigger = createTrigger({
	auth: activeCampaignAuth,
	name: 'activecampaign_updated_contact',
	displayName: 'Updated Contact',
	description: 'Triggers when an existing contact details are updated.',
	type: TriggerStrategy.WEBHOOK,
	props: {},
	async onEnable(context) {
		const client = makeClient(context.auth);
		const res = await client.subscribeWebhook({
			name: `Activepieces Updated Contact Hook`,
			url: context.webhookUrl,
			events: ['update'],
			sources: WEBHOOK_SOURCES,
		});
		await context.store.put<CreateWebhookResponse>('activecampaign_updated_contact', res);
	},
	async run(context) {
		return [context.payload.body];
	},
	async onDisable(context) {
		const webhook = await context.store.get<CreateWebhookResponse>(
			'activecampaign_updated_contact',
		);
		if (webhook != null) {
			const client = makeClient(context.auth);
			await client.unsubscribeWebhook(webhook.webhook.id);
		}
	},
	sampleData: {
		type: 'update',
		date_time: '2024-02-28T07:16:48-06:00',
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
			tags: 'tag1, tag2',
			fields: ['Option 1', '||Option 1||Option 2||'],
			customer_acct_name: '',
			orgname: '',
		},
		customer_acct_name: '',
		customer_acct_id: '0',
		orgname: '',
	},
});
