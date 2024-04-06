import { activeCampaignAuth } from '../..';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { CreateWebhookResponse } from '../common/types';
import { WEBHOOK_SOURCES } from '../common/constants';

export const newOrUpdatedAccountTrigger = createTrigger({
	auth: activeCampaignAuth,
	name: 'activecampaign_new_or_updated_account',
	displayName: 'New or Updated Account',
	description: 'Triggers when a new account is added or an existing account’s details are updated',
	type: TriggerStrategy.WEBHOOK,
	props: {},
	async onEnable(context) {
		const client = makeClient(context.auth);
		const res = await client.subscribeWebhook({
			name: `Activepieces New Account Hook`,
			url: context.webhookUrl,
			events: ['account_add', 'account_update'],
			sources: WEBHOOK_SOURCES,
		});
		await context.store.put<CreateWebhookResponse>('activecampaign_new_or_updated_account', res);
	},
	async run(context) {
		return [context.payload.body];
	},
	async onDisable(context) {
		const webhook = await context.store.get<CreateWebhookResponse>(
			'activecampaign_new_or_updated_account',
		);
		if (webhook != null) {
			const client = makeClient(context.auth);
			await client.unsubscribeWebhook(webhook.webhook.id);
		}
	},
	sampleData: {
		type: 'account_update',
		date_time: '2024-02-28T06:44:32-06:00',
		initiated_from: 'admin',
		initiated_by: 'admin',
		list: '0',
		account: {
			id: '1',
			name: 'John Wick',
			account_url: 'https://www.github.com',
			created_timestamp: '2024-02-28 01:09:17',
			updated_timestamp: '2024-02-28 06:44:32',
			fields: {
				'0': { id: '1', key: 'Description', value: 'Desc' },
				'1': { id: '2', key: 'Address 1', value: 'Address 1' },
				'2': { id: '3', key: 'Address 2', value: 'Address 2' },
				'3': { id: '4', key: 'City', value: 'City' },
				'4': { id: '5', key: 'State/Province', value: 'State' },
				'5': { id: '6', key: 'Postal Code', value: '75156' },
				'6': { id: '7', key: 'Country', value: 'India' },
				'7': { id: '8', key: 'Number of Employees', value: '101 - 500' },
				'8': { id: '9', key: 'Annual Revenue', value: 'Less than 100K' },
				'9': { id: '10', key: 'Industry/Vertical', value: 'Accounting/Financial' },
				'10': { key: 'Phone Number', value: '' },
				'11': { id: '11', key: 'Text Input', value: 'Text Input' },
				'12': { id: '12', key: 'Text Area', value: 'Text Area' },
				'13': { id: '13', key: 'Number', value: '18.000' },
				'14': { id: '14', key: 'money', value: '18' },
				'15': { id: '15', key: 'Date', value: '2024-02-28 00:00:00' },
				'16': { key: 'Date Time', value: '' },
				'17': { id: '16', key: 'Drop Down', value: 'Option 3' },
				'18': { id: '17', key: 'List box', value: ['Option 1', 'Option 2'] },
				'19': { id: '18', key: 'Radio Buttons', value: 'Option 1' },
				'20': { id: '19', key: 'Check Box', value: ['Option 1', 'Option 2'] },
				'21': { id: '20', key: 'Hidden', value: 'Hidden' },
			},
		},
		updated_fields: ['name'],
	},
});
