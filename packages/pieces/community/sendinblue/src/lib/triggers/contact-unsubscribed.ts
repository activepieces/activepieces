import { brevoRegisterTrigger } from './register-webhook';
import { WEBHOOK_ID_NOTE } from './samples';
import { contactUnsubscribedTriggerOutputSchema } from '../output-schemas';

export const contactUnsubscribed = brevoRegisterTrigger({
	name: 'contact_unsubscribed',
	displayName: 'Contact Unsubscribed',
	description: 'Triggers when a contact unsubscribes from a campaign.',
	aiDescription:
		`Fires when a contact unsubscribes, so opt-outs can be honoured in other systems. The payload carries the contact email and the campaign and list identifiers behind the unsubscribe. ${WEBHOOK_ID_NOTE}`,
	type: 'marketing',
	events: ['unsubscribed'],
	sampleData: {
		id: 2152074,
		event: 'unsubscribe',
		email: 'contact@example.com',
		camp_id: 12,
		campaign_name: 'My First Campaign',
		list_id: [3, 42],
		date: '2026-08-25 11:05:00',
		ts: 1787655900,
	},
	outputSchema: contactUnsubscribedTriggerOutputSchema,
});
