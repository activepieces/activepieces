import { activeCampaignAuth } from '../auth';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { activeCampaignWebhook } from '../common/webhook';
import { dealTriggerOutputSchema } from '../common/output-schemas';

const STORE_KEY = 'activecampaign_new_deal_added_or_updated';

export const newDealAddedOrUpdatedTrigger = createTrigger({
	auth: activeCampaignAuth,
	name: 'activecampaign_new_deal_added_or_updated',
	classification: 'READ',
	displayName: 'New Deal Added or Updated',
	description: 'Triggers when a new deal is created or existing deal is updated. Also fires for changes made through the API, including this piece\'s own actions, so a flow that changes the same record can trigger itself again.',
	aiMetadata: {
		description: 'Fires when a deal (CRM sales opportunity) is created or when an existing deal is updated, covering both add and update events. The payload identifies which event occurred and lists the changed fields for updates.',
	},
	outputSchema: dealTriggerOutputSchema,
	type: TriggerStrategy.WEBHOOK,
	props: {},
	async onEnable(context) {
		await activeCampaignWebhook.enable({
			auth: context.auth.props,
			store: context.store,
			storeKey: STORE_KEY,
			webhookUrl: context.webhookUrl,
			hookName: 'Activepieces New Deal Hook',
			events: ['deal_add', 'deal_update'],
		});
	},
	async run(context) {
		return activeCampaignWebhook.run({ store: context.store, storeKey: STORE_KEY, body: context.payload.body });
	},
	async onDisable(context) {
		await activeCampaignWebhook.disable({ auth: context.auth.props, store: context.store, storeKey: STORE_KEY });
	},
	sampleData: {
		type: 'deal_update',
		date_time: '2026-11-08T05:15:40-06:00',
		initiated_from: 'api',
		initiated_by: 'api',
		list: '0',
		contact: {
			id: '2',
			email: 'apqa1@example.com',
			first_name: 'QA',
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
		deal: {
			id: '1',
			title: 'QA Deal AI',
			create_date: '2026-11-08 05:15:12',
			create_date_iso: '2026-11-08T05:15:12-06:00',
			orgid: '0',
			orgname: '',
			stageid: '2',
			stage_title: 'In Contact',
			pipelineid: '1',
			pipeline_title: 'Sales Pipeline',
			value: '0.29',
			value_raw: '0.29',
			currency: 'usd',
			currency_symbol: '$',
			owner: '1',
			owner_firstname: 'Alex',
			owner_lastname: 'Owner',
			contactid: '2',
			contact_email: 'apqa1@example.com',
			contact_firstname: 'QA',
			contact_lastname: 'Trig',
			status: '0',
			fields: [
				{
					key: 'Forecasted Close Date',
					value: '',
				},
			],
		},
		updated_fields: ['nexttaskid'],
	},
});
