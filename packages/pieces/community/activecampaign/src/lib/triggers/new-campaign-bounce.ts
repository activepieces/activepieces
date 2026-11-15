import { activeCampaignAuth } from '../auth';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { activeCampaignWebhook } from '../common/webhook';
import { campaignBounceTriggerOutputSchema } from '../common/output-schemas';

const STORE_KEY = 'activecampaign_new_campaign_bounce';

export const newCampaignBounceTrigger = createTrigger({
	auth: activeCampaignAuth,
	name: 'activecampaign_new_campaign_bounce',
	classification: 'READ',
	displayName: 'New Campaign Bounce',
	description: 'Triggers when a contact email address bounces from a sent campaign.',
	aiMetadata: {
		description: 'Fires when a contact email address bounces from a sent campaign. Represents the bounce event with the affected contact and the campaign that triggered it.',
	},
	outputSchema: campaignBounceTriggerOutputSchema,
	type: TriggerStrategy.WEBHOOK,
	props: {},
	async onEnable(context) {
		await activeCampaignWebhook.enable({
			auth: context.auth.props,
			store: context.store,
			storeKey: STORE_KEY,
			webhookUrl: context.webhookUrl,
			hookName: 'Activepieces Campaign Bounce Hook',
			events: ['bounce'],
		});
	},
	async run(context) {
		return activeCampaignWebhook.run({ store: context.store, storeKey: STORE_KEY, body: context.payload.body });
	},
	async onDisable(context) {
		await activeCampaignWebhook.disable({ auth: context.auth.props, store: context.store, storeKey: STORE_KEY });
	},
	sampleData: {
		type: 'bounce',
		date_time: '2026-11-08T05:44:01-06:00',
		initiated_from: 'system',
		initiated_by: 'system',
		list: [
			{
				id: '3',
				name: 'Master Contact List',
			},
		],
		campaign: {
			id: '4',
			status: '5',
			name: 'AP trigger test',
			type: 'single',
			recipients: '4',
		},
		bounce: {
			type: 'hard',
			code: '5.1.1',
			description: 'The email account that you tried to reach does not exist. Please try double-checking the recipient\'s email address for typos or unnecessary spaces. For more information, go to  https://support.google.com/mail/?p=NoSuchUser <trace-id> - gsmtp',
		},
		contact: {
			id: '9',
			email: 'bounce.test@example.com',
			first_name: 'Bounce',
			last_name: 'Test',
			phone: '',
			ip: '0.0.0.0',
			tags: '',
			customer_acct_name: '',
			orgname: '',
		},
		customer_acct_name: '',
		customer_acct_id: '0',
		orgname: '',
		account_id: '1000001',
	},
});
