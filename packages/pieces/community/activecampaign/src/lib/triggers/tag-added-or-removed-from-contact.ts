import { activeCampaignAuth } from '../..';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { CreateWebhookResponse } from '../common/types';
import { WEBHOOK_SOURCES } from '../common/constants';

export const newtagAddedOrRemovedFromContactTrigger = createTrigger({
	auth: activeCampaignAuth,
	name: 'activecampaign_new_tag_added_or_removed_from_contact',
	displayName: 'Tag Added or Removed From Contact',
	description: 'Triggers when a a Tag is added or removed from a Contact',
	type: TriggerStrategy.WEBHOOK,
	props: {},
	async onEnable(context) {
		const client = makeClient(context.auth);
		const res = await client.subscribeWebhook({
			name: `Activepieces Contact Tag Hook`,
			url: context.webhookUrl,
			events: ['contact_tag_added', 'contact_tag_removed'],
			sources: WEBHOOK_SOURCES,
		});
		await context.store.put<CreateWebhookResponse>(
			'activecampaign_new_tag_added_or_removed_from_contact',
			res,
		);
	},
	async run(context) {
		return [context.payload.body];
	},
	async onDisable(context) {
		const webhook = await context.store.get<CreateWebhookResponse>(
			'activecampaign_new_tag_added_or_removed_from_contact',
		);
		if (webhook != null) {
			const client = makeClient(context.auth);
			await client.unsubscribeWebhook(webhook.webhook.id);
		}
	},
	sampleData: {
		type: 'contact_tag_added',
		date_time: '2024-02-28T07:04:13-06:00',
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
			customer_acct_name: '',
			orgname: '',
		},
		customer_acct_name: '',
		customer_acct_id: '0',
		orgname: '',
		tag: 'tag2',
	},
});
