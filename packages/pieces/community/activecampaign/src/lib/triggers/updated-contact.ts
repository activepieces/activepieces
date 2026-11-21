import { activeCampaignAuth } from '../auth';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { activecampaignCommon } from '../common';
import { activeCampaignWebhook } from '../common/webhook';
import { updatedContactTriggerOutputSchema } from '../common/output-schemas';

const STORE_KEY = 'activecampaign_updated_contact';

export const updatedContactTrigger = createTrigger({
	auth: activeCampaignAuth,
	name: 'activecampaign_updated_contact',
	classification: 'READ',
	displayName: 'Updated Contact',
	description: 'Triggers when a contact\'s details are updated.',
	aiMetadata: {
		description: 'Fires when an existing contact\'s details are updated. The payload contains the updated contact record including its current field values and tags.',
	},
	outputSchema: updatedContactTriggerOutputSchema,
	type: TriggerStrategy.WEBHOOK,
	props: {
		selfTriggerNote: activecampaignCommon.selfTriggerNote,
	},
	async onEnable(context) {
		await activeCampaignWebhook.enable({
			auth: context.auth.props,
			store: context.store,
			storeKey: STORE_KEY,
			webhookUrl: context.webhookUrl,
			hookName: 'Activepieces Updated Contact Hook',
			events: ['update'],
		});
	},
	async run(context) {
		return activeCampaignWebhook.run({ store: context.store, storeKey: STORE_KEY, body: context.payload.body });
	},
	async onDisable(context) {
		await activeCampaignWebhook.disable({ auth: context.auth.props, store: context.store, storeKey: STORE_KEY });
	},
	sampleData: {
		type: 'update',
		date_time: '2026-11-08T01:36:38-06:00',
		initiated_from: 'api',
		initiated_by: 'api',
		list: '0',
		contact: {
			id: '2',
			email: 'apqa1@example.com',
			first_name: 'QA2',
			last_name: 'Trig',
			phone: '+15550001',
			ip: '0.0.0.0',
			tags: 'ap-qa-tag',
			fields: ['fr'],
			customer_acct_name: 'AP QA Corp',
			orgname: 'AP QA Corp',
		},
		customer_acct_name: 'AP QA Corp',
		customer_acct_id: '1',
		orgname: 'AP QA Corp',
	},
});
