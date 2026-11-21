import { activeCampaignAuth } from '../auth';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { activecampaignCommon } from '../common';
import { activeCampaignWebhook } from '../common/webhook';
import { contactTagTriggerOutputSchema } from '../common/output-schemas';

const STORE_KEY = 'activecampaign_new_tag_added_or_removed_from_contact';

export const newtagAddedOrRemovedFromContactTrigger = createTrigger({
	auth: activeCampaignAuth,
	name: 'activecampaign_new_tag_added_or_removed_from_contact',
	classification: 'READ',
	displayName: 'Tag Added or Removed from Contact',
	description: 'Triggers when a tag is added to or removed from a contact.',
	aiMetadata: {
		description: 'Fires when a tag is added to or removed from a contact, covering both tag-added and tag-removed events. The payload identifies the affected contact and the tag.',
	},
	outputSchema: contactTagTriggerOutputSchema,
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
			hookName: 'Activepieces Contact Tag Hook',
			events: ['contact_tag_added', 'contact_tag_removed'],
		});
	},
	async run(context) {
		return activeCampaignWebhook.run({ store: context.store, storeKey: STORE_KEY, body: context.payload.body });
	},
	async onDisable(context) {
		await activeCampaignWebhook.disable({ auth: context.auth.props, store: context.store, storeKey: STORE_KEY });
	},
	sampleData: {
		type: 'contact_tag_added',
		date_time: '2026-11-08T01:36:39-06:00',
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
		tag: 'ap-qa-tag',
	},
});
