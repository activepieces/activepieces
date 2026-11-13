import { activeCampaignAuth } from '../auth';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { activeCampaignWebhook } from '../common/webhook';
import { contactTaskTriggerOutputSchema } from '../common/output-schemas';

const STORE_KEY = 'activecampaign_new_contact_task';

export const newContactTaskTrigger = createTrigger({
	auth: activeCampaignAuth,
	name: 'activecampaign_new_contact_task',
	classification: 'READ',
	displayName: 'New Contact Task',
	description: 'Triggers when a new contact task is added. Also fires for changes made through the API, including this piece\'s own actions, so a flow that changes the same record can trigger itself again.',
	aiMetadata: {
		description: 'Fires when a task is created on a contact. The payload includes the task (type, title, due date) and the associated contact.',
	},
	outputSchema: contactTaskTriggerOutputSchema,
	type: TriggerStrategy.WEBHOOK,
	props: {},
	async onEnable(context) {
		await activeCampaignWebhook.enable({
			auth: context.auth.props,
			store: context.store,
			storeKey: STORE_KEY,
			webhookUrl: context.webhookUrl,
			hookName: 'Activepieces New Contact Task Hook',
			events: ['contact_task_add'],
		});
	},
	async run(context) {
		return activeCampaignWebhook.run({ store: context.store, storeKey: STORE_KEY, body: context.payload.body });
	},
	async onDisable(context) {
		await activeCampaignWebhook.disable({ auth: context.auth.props, store: context.store, storeKey: STORE_KEY });
	},
	sampleData: {
		type: 'contact_task_add',
		date_time: '2026-11-08T01:36:45-06:00',
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
		task: {
			id: '3',
			type_id: '3',
			title: 'trigger task',
			duedate: '2026-11-24 18:00:00',
			duedate_iso: '2026-11-24T18:00:00-06:00',
			edate: '2026-11-24 18:15:00',
			edate_iso: '2026-11-24T18:15:00-06:00',
			type_title: 'Lunch',
		},
	},
});
