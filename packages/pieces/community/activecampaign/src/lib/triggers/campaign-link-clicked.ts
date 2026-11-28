import { activeCampaignAuth } from '../auth';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { activeCampaignWebhook } from '../common/webhook';
import { campaignLinkClickedTriggerOutputSchema } from '../common/output-schemas';

const STORE_KEY = 'activecampaign_campaign_link_clicked';

export const campaignLinkClickedTrigger = createTrigger({
	auth: activeCampaignAuth,
	name: 'activecampaign_campaign_link_clicked',
	classification: 'READ',
	displayName: 'New Campaign Link Click',
	description:
		'Triggers when a contact clicks a link in a campaign message (will only run once for each unique link).',
	aiMetadata: {
		description: 'Fires when a contact clicks a tracked link inside a sent campaign email, firing only once per unique link per contact. Represents the click event with the contact and the campaign that contained the link.',
	},
	outputSchema: campaignLinkClickedTriggerOutputSchema,
	type: TriggerStrategy.WEBHOOK,
	props: {},
	async onEnable(context) {
		await activeCampaignWebhook.enable({
			auth: context.auth.props,
			store: context.store,
			storeKey: STORE_KEY,
			webhookUrl: context.webhookUrl,
			hookName: 'Activepieces Campaign Link Click Hook',
			events: ['click'],
		});
	},
	async run(context) {
		return activeCampaignWebhook.run({ store: context.store, storeKey: STORE_KEY, body: context.payload.body });
	},
	async onDisable(context) {
		await activeCampaignWebhook.disable({ auth: context.auth.props, store: context.store, storeKey: STORE_KEY });
	},
	sampleData: {
		type: 'click',
		date_time: '2026-11-08T06:24:28-06:00',
		initiated_from: 'public',
		initiated_by: 'contact',
		list: [
			{
				id: '3',
				name: 'Master Contact List',
			},
		],
		campaign: {
			id: '8',
			status: '5',
			name: 'AP trigger test (Copy) (Copy)',
			type: 'single',
			recipients: '4',
			message: {
				id: '9',
				subject: 'testing campigns',
			},
		},
		link: {
			id: '22',
			url: 'https://example.com',
		},
		contact: {
			id: '8',
			email: 'jane.doe@example.com',
			first_name: 'Jane',
			last_name: 'Doe',
			phone: '+15550002',
			ip: '203.0.113.10',
			tags: '',
			fields: [''],
			customer_acct_name: 'AP QA Corp',
			orgname: 'AP QA Corp',
		},
		customer_acct_name: 'AP QA Corp',
		customer_acct_id: '1',
		orgname: 'AP QA Corp',
		account_id: '1000001',
	},
});
