import { brevoRegisterTrigger } from './register-webhook';
import { WEBHOOK_ID_NOTE } from './samples';
import { contactDeletedTriggerOutputSchema } from '../output-schemas';

export const contactDeleted = brevoRegisterTrigger({
	name: 'contact_deleted',
	displayName: 'Contact Deleted',
	description: 'Triggers when a contact is deleted.',
	aiDescription:
		`Fires when a Brevo contact is deleted, so downstream systems can drop the record. Unlike the other contact events the email field is an ARRAY of addresses, and date is an ISO 8601 timestamp rather than the space separated format the other events use. ${WEBHOOK_ID_NOTE}`,
	type: 'marketing',
	events: ['contactDeleted'],
	sampleData: {
		id: 2152073,
		event: 'contact_deleted',
		email: ['contact@example.com'],
		date: '2026-08-25T11:04:17.82511Z',
		ts: 1787655857,
	},
	outputSchema: contactDeletedTriggerOutputSchema,
});
