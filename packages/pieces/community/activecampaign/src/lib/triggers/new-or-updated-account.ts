import { activeCampaignAuth } from '../auth';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { activeCampaignWebhook } from '../common/webhook';
import { accountTriggerOutputSchema } from '../common/output-schemas';

const STORE_KEY = 'activecampaign_new_or_updated_account';

export const newOrUpdatedAccountTrigger = createTrigger({
	auth: activeCampaignAuth,
	name: 'activecampaign_new_or_updated_account',
	classification: 'READ',
	displayName: 'New or Updated Account',
	description: 'Triggers when a new account is added or an existing account’s details are updated. Also fires for changes made through the API, including this piece\'s own actions, so a flow that changes the same record can trigger itself again.',
	aiMetadata: {
		description: 'Fires when an account (CRM organization/company) is created or when an existing account is updated, covering both add and update events. The payload identifies the event and, for updates, the changed fields.',
	},
	outputSchema: accountTriggerOutputSchema,
	type: TriggerStrategy.WEBHOOK,
	props: {},
	async onEnable(context) {
		await activeCampaignWebhook.enable({
			auth: context.auth.props,
			store: context.store,
			storeKey: STORE_KEY,
			webhookUrl: context.webhookUrl,
			hookName: 'Activepieces New Account Hook',
			events: ['account_add', 'account_update'],
		});
	},
	async run(context) {
		return activeCampaignWebhook.run({ store: context.store, storeKey: STORE_KEY, body: context.payload.body });
	},
	async onDisable(context) {
		await activeCampaignWebhook.disable({ auth: context.auth.props, store: context.store, storeKey: STORE_KEY });
	},
	sampleData: {
		type: 'account_update',
		date_time: '2026-11-08T01:36:47-06:00',
		initiated_from: 'api',
		initiated_by: 'api',
		list: '0',
		account: {
			id: '1',
			name: 'AP QA Corp Trig',
			account_url: 'https://example.org',
			created_timestamp: '2026-11-08 01:31:19',
			updated_timestamp: '2026-11-08 01:36:47',
			fields: [
				{
					key: 'Description',
					value: '',
				},
				{
					key: 'Address 1',
					value: '',
				},
				{
					key: 'Address 2',
					value: '',
				},
				{
					id: '1',
					key: 'City',
					value: 'Amman',
				},
				{
					key: 'State/Province',
					value: '',
				},
				{
					key: 'Postal Code',
					value: '',
				},
				{
					key: 'Country',
					value: '',
				},
				{
					key: 'Number of Employees',
					value: '',
				},
				{
					key: 'Annual Revenue',
					value: '',
				},
				{
					key: 'Industry/Vertical',
					value: '',
				},
				{
					key: 'Phone Number',
					value: '',
				},
			],
		},
		updated_fields: ['name'],
	},
});
