import { intercomAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomClient } from '../common';

export const addNoteToUserAction = createAction({
	auth: intercomAuth,
	name: 'add-note-to-user',
	displayName: 'Add Note',
	description: 'Add a note to a user',
	audience: 'both',
	aiMetadata: { description: 'Add an internal note to a contact resolved by email address; errors if no contact matches that email. Each call appends a new note, so it is not idempotent. This attaches a note to a contact, distinct from Add note to conversation which annotates a conversation thread.', idempotent: false },
	props: {
		email: Property.ShortText({
			displayName: 'Email',
			required: true,
		}),
		body: Property.LongText({
			displayName: 'Note Text',
			required: true,
		}),
	},
	async run(context) {
		const client = intercomClient(context.auth);

		const contactResponse = await client.contacts.search({
			query: {
				field: 'email',
				operator: '=',
				value: context.propsValue.email,
			},
		});

		if (contactResponse.data.length === 0) {
			throw new Error('Could not find user with this email address.');
		}

		const contactId = contactResponse.data[0].id;

		const noteResponse = await client.notes.create({
			contact_id: contactId,
			body: context.propsValue.body,
		});

        return noteResponse;
	},
});
