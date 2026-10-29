import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomAuth } from '../../auth';
import { intercomRequest } from '../../common';
import { resolveAdminId } from '../../common/client';
import { requireText } from '../../common/lookups';
import { noteOutputSchema } from '../../output-schemas';

export const addNoteToContactAction = createAction({
	auth: intercomAuth,
	name: 'add_note_to_contact',
	classification: 'WRITE',
	displayName: 'Add Note to Contact (by ID)',
	description: 'Adds an internal note to a contact by contact ID.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Adds an internal note to one contact (user or lead) by Intercom contact ID; only teammates see it. Get the ID from Get Contact or Search Contacts. Use Add Note to Conversation (by ID) to annotate a conversation instead. Each call adds another note, so retries duplicate.',
		idempotent: false,
	},
	props: {
		contactId: Property.ShortText({
			displayName: 'Contact ID',
			description: 'The Intercom contact ID.',
			required: true,
		}),
		body: Property.LongText({
			displayName: 'Note Text',
			description: 'The note text. Simple HTML is allowed.',
			required: true,
		}),
		adminId: Property.ShortText({
			displayName: 'Author Admin ID',
			description: 'The admin shown as the author. Leave empty to use the admin who owns this connection.',
			required: false,
		}),
	},
	outputSchema: noteOutputSchema,
	async run(context) {
		const contactId = requireText({ label: 'Contact ID', value: context.propsValue.contactId });
		const body = requireText({ label: 'Note Text', value: context.propsValue.body });
		const adminId = await resolveAdminId({ auth: context.auth, adminId: context.propsValue.adminId });
		return intercomRequest<Record<string, unknown>>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: ['contacts', contactId, 'notes'],
			body: { body, admin_id: adminId },
			operation: 'add the note',
		});
	},
});
