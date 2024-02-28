import { activeCampaignAuth } from '../..';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { CreateWebhookResponse } from '../common/types';
import { WEBHOOK_SOURCES } from '../common/constants';

export const campaignLinkClickedTrigger = createTrigger({
	auth: activeCampaignAuth,
	name: 'activecampaign_campaign_link_clicked',
	displayName: 'New Campaign Link Click',
	description:
		'Triggers when a contact clicks a link in a campaign message (will only run once for each unique link).',
	type: TriggerStrategy.WEBHOOK,
	props: {},
	async onEnable(context) {
		const client = makeClient(context.auth);
		const res = await client.subscribeWebhook({
			name: `Activepieces Deal Task Completed Hook`,
			url: context.webhookUrl,
			events: ['click'],
			sources: WEBHOOK_SOURCES,
		});
		await context.store.put<CreateWebhookResponse>('activecampaign_campaign_link_clicked', res);
	},
	async run(context) {
		return [context.payload.body];
	},
	async onDisable(context) {
		const webhook = await context.store.get<CreateWebhookResponse>(
			'activecampaign_campaign_link_clicked',
		);
		if (webhook != null) {
			const client = makeClient(context.auth);
			await client.unsubscribeWebhook(webhook.webhook.id);
		}
	},
	sampleData: {
		type: 'deal_update',
		date_time: '2024-02-28T04:45:41-06:00',
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
		deal: {
			id: '1',
			title: 'Test Deal',
			create_date: '2024-02-28 04:36:09',
			create_date_iso: '2024-02-28T04:36:09-06:00',
			orgid: '1',
			orgname: 'John Wick',
			stageid: '1',
			stage_title: 'To Contact',
			pipelineid: '1',
			pipeline_title: 'Test Pipeline',
			value: '1,044,055.00',
			value_raw: '1044055',
			currency: 'usd',
			currency_symbol: '$',
			owner: '1',
			owner_firstname: 'John',
			owner_lastname: 'Wick',
			contactid: '3',
			contact_email: 'code.test@gmail.com',
			contact_firstname: 'John',
			contact_lastname: 'Wick',
			status: '0',
			fields: [{ id: '1', key: 'Forecasted Close Date', value: '2024-02-08 00:00:00' }],
		},
		updated_fields: ['value'],
	},
});
