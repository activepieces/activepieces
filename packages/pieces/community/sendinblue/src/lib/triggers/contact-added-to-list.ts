import { brevoRegisterTrigger } from './register-webhook';
import { WEBHOOK_ID_NOTE } from './samples';
import { contactAddedToListTriggerOutputSchema } from '../output-schemas';

export const contactAddedToList = brevoRegisterTrigger({
	name: 'contact_added_to_list',
	displayName: 'Contact Added to List',
	description: 'Triggers when a contact is added to one of your lists.',
	aiDescription:
		`Fires when a contact is added to any Brevo list. The payload carries the contact email and a list_id array of the lists it was added to. Brevo subscribes at account level, so this fires for every list; filter on list_id downstream when only one list matters. ${WEBHOOK_ID_NOTE}`,
	type: 'marketing',
	events: ['listAddition'],
	sampleData: {
		id: 2152070,
		event: 'list_addition',
		email: 'contact@example.com',
		list_id: [2],
		date: '2026-08-25 11:02:27',
		ts: 1787655747,
	},
	outputSchema: contactAddedToListTriggerOutputSchema,
});
