import { activeCampaignAuth } from '../auth';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { activeCampaignWebhook } from '../common/webhook';
import { contactUnsubscribedTriggerOutputSchema } from '../common/output-schemas';

const STORE_KEY = 'activecampaign_contact_unsubscribed';

export const contactUnsubscribedTrigger = createTrigger({
	auth: activeCampaignAuth,
	name: 'activecampaign_contact_unsubscribed',
	classification: 'READ',
	displayName: 'Contact Unsubscribed',
	description: 'Triggers when a contact unsubscribes from a list. Also fires for changes made through the API, including this piece\'s own actions, so a flow that changes the same record can trigger itself again.',
	aiMetadata: {
		description: 'Fires once per contact unsubscribe from a list, from an unsubscribe link, the app or the API. Unlike the other ActiveCampaign events, list is an array of { id, name } for the lists left, and active_subscriptions holds the IDs of lists the contact is still on ("0" when none).',
	},
	outputSchema: contactUnsubscribedTriggerOutputSchema,
	type: TriggerStrategy.WEBHOOK,
	props: {},
	async onEnable(context) {
		await activeCampaignWebhook.enable({
			auth: context.auth.props,
			store: context.store,
			storeKey: STORE_KEY,
			webhookUrl: context.webhookUrl,
			hookName: 'Activepieces Contact Unsubscribed Hook',
			events: ['unsubscribe'],
		});
	},
	async run(context) {
		return activeCampaignWebhook.run({ store: context.store, storeKey: STORE_KEY, body: context.payload.body });
	},
	async onDisable(context) {
		await activeCampaignWebhook.disable({ auth: context.auth.props, store: context.store, storeKey: STORE_KEY });
	},
	sampleData: {
		type: 'unsubscribe',
		date_time: '2026-11-08T01:36:50-06:00',
		initiated_from: 'api',
		initiated_by: 'api',
		list: [
			{
				id: '3',
				name: 'Master Contact List',
			},
		],
		contact: {
			id: '3',
			email: 'apqa2@example.com',
			first_name: 'QA',
			last_name: 'Two-Upd',
			phone: '',
			ip: '0.0.0.0',
			tags: '',
			customer_acct_name: 'AP QA Two Upd',
			orgname: 'AP QA Two Upd',
		},
		customer_acct_name: 'AP QA Two Upd',
		customer_acct_id: '2',
		orgname: 'AP QA Two Upd',
		account_id: '1000001',
		active_subscriptions: ['0'],
	},
});
