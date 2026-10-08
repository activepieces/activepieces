import { brevoRegisterTrigger } from './register-webhook';
import { WEBHOOK_ID_NOTE } from './samples';
import { contactUpdatedTriggerOutputSchema } from '../output-schemas';

export const contactUpdated = brevoRegisterTrigger({
	name: 'contact_updated',
	displayName: 'Contact Updated',
	description: 'Triggers when the attributes of a contact are updated.',
	aiDescription:
		`Fires when an existing Brevo contact is modified. The payload carries the contact email plus a content array whose single entry holds the contact email and an attributes object of the fields that changed. ${WEBHOOK_ID_NOTE}`,
	type: 'marketing',
	events: ['contactUpdated'],
	sampleData: {
		id: 2152072,
		event: 'contact_updated',
		email: 'contact@example.com',
		date: '2026-08-25 11:04:09',
		ts: 1787655849,
		content: [
			{
				email: 'contact@example.com',
				attributes: { FIRSTNAME: 'Elly' },
			},
		],
	},
	outputSchema: contactUpdatedTriggerOutputSchema,
});
