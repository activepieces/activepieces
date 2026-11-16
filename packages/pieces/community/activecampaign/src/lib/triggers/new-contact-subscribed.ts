import { activeCampaignAuth } from '../auth';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { activeCampaignWebhook } from '../common/webhook';
import { contactSubscribedTriggerOutputSchema } from '../common/output-schemas';

const STORE_KEY = 'activecampaign_new_contact_subscribed';

export const newContactSubscribedTrigger = createTrigger({
	auth: activeCampaignAuth,
	name: 'activecampaign_new_contact_subscribed',
	classification: 'READ',
	displayName: 'New Contact Subscribed',
	description: 'Triggers when a contact subscribes to a list (not on imports). Also fires for changes made through the API, including this piece\'s own actions, so a flow that changes the same record can trigger itself again.',
	aiMetadata: {
		description: 'Fires once per contact subscription to a list, whether the contact was added through a form, the app or the API. Contact imports do not fire it. The payload holds the list ID and the contact.',
	},
	outputSchema: contactSubscribedTriggerOutputSchema,
	type: TriggerStrategy.WEBHOOK,
	props: {},
	async onEnable(context) {
		await activeCampaignWebhook.enable({
			auth: context.auth.props,
			store: context.store,
			storeKey: STORE_KEY,
			webhookUrl: context.webhookUrl,
			hookName: 'Activepieces New Contact Subscribed Hook',
			events: ['subscribe'],
		});
	},
	async run(context) {
		return activeCampaignWebhook.run({ store: context.store, storeKey: STORE_KEY, body: context.payload.body });
	},
	async onDisable(context) {
		await activeCampaignWebhook.disable({ auth: context.auth.props, store: context.store, storeKey: STORE_KEY });
	},
	sampleData: {
		type: 'subscribe',
		date_time: '2026-11-08T01:36:48-06:00',
		initiated_from: 'api',
		initiated_by: 'api',
		list: '3',
		contact: {
			id: '2',
			email: 'apqa1@example.com',
			first_name: 'QA2',
			last_name: 'Trig',
			phone: '+15550001',
			ip: '0.0.0.0',
			tags: 'ap-qa-tag',
			fields: ['fr'],
			customer_acct_name: 'AP QA Corp Trig',
			orgname: 'AP QA Corp Trig',
		},
		customer_acct_name: 'AP QA Corp Trig',
		customer_acct_id: '1',
		orgname: 'AP QA Corp Trig',
		active_subscriptions: ['3'],
	},
});
