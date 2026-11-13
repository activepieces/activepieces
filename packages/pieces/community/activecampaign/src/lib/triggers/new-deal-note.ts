import { activeCampaignAuth } from '../auth';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { activeCampaignWebhook } from '../common/webhook';
import { dealNoteTriggerOutputSchema } from '../common/output-schemas';

const STORE_KEY = 'activecampaign_new_deal_note';

export const newDealNoteTrigger = createTrigger({
	auth: activeCampaignAuth,
	name: 'activecampaign_new_deal_note',
	classification: 'READ',
	displayName: 'New Deal Note',
	description: 'Triggers when a new deal note is created. Also fires for changes made through the API, including this piece\'s own actions, so a flow that changes the same record can trigger itself again.',
	aiMetadata: {
		description: 'Fires when a note is added to a deal. The payload includes the note text and the associated deal.',
	},
	outputSchema: dealNoteTriggerOutputSchema,
	type: TriggerStrategy.WEBHOOK,
	props: {},
	async onEnable(context) {
		await activeCampaignWebhook.enable({
			auth: context.auth.props,
			store: context.store,
			storeKey: STORE_KEY,
			webhookUrl: context.webhookUrl,
			hookName: 'Activepieces New Deal Note Hook',
			events: ['deal_note_add'],
		});
	},
	async run(context) {
		return activeCampaignWebhook.run({ store: context.store, storeKey: STORE_KEY, body: context.payload.body });
	},
	async onDisable(context) {
		await activeCampaignWebhook.disable({ auth: context.auth.props, store: context.store, storeKey: STORE_KEY });
	},
	sampleData: {
		type: 'deal_note_add',
		date_time: '2026-11-08T05:15:36-06:00',
		initiated_from: 'api',
		initiated_by: 'api',
		list: '0',
		note: {
			id: '6',
			text: 'deal note from AP',
		},
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
	},
});
