import { intercomAuth } from '../auth';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { intercomClient, TriggerPayload } from '../common';

export const newUnsubscriptionTrigger = createTrigger({
	auth: intercomAuth,
	name: 'new-unsubscription',
	displayName: 'New Unsubscription',
	description: 'Triggers when a contact unsubscribes from your emails.',
	aiMetadata: {
		description:
			'Fires when a contact unsubscribes from email in  Intercom. Outputs the contact that unsubscribed.',
	},
	props: {},
	type: TriggerStrategy.APP_WEBHOOK,
	async onEnable(context) {
		const client = intercomClient(context.auth);
		const response = await client.admins.identify(); 

		if (!response.app?.id_code) {
			throw new Error('Could not find admin id code');
		}

		context.app.createListeners({
			events: ['contact.unsubscribed'],
			identifierValue: response['app']['id_code'],
		});
	},
	async onDisable(context) {
		// implement webhook deletion logic
	},
	async test(context) {
		const client = intercomClient(context.auth);

		const response = await client.contacts.search({
			query: {
				field: 'unsubscribed_from_emails',
				operator: '=',
				value: 'true',
			},
			pagination: { per_page: 5 },
		});

		return response.data;
	},
	async run(context) {
		const payload = context.payload.body as TriggerPayload;
		return [payload.data.item];
	},
	sampleData: {
		type: 'contact',
		id: '67a9b9dfcc14109e073fbe19',
		workspace_id: 'nzekhfwb',
		external_id: '5b803f65-bcec-4198-b4f4-a0588454b537',
		role: 'user',
		email: 'john.doe@example.com',
		name: 'John Doe',
		unsubscribed_from_emails: true,
		created_at: '2025-02-10T08:33:35.910+00:00',
		updated_at: '2025-02-10T08:33:35.907+00:00',
	},
});
