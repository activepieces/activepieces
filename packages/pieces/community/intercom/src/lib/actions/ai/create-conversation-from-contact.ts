import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomAuth } from '../../auth';
import { intercomRequest } from '../../common';
import { requireText, resolveContact } from '../../common/lookups';
import { messageOutputSchema } from '../../output-schemas';

export const createConversationFromContactAction = createAction({
	auth: intercomAuth,
	name: 'create_conversation_from_contact',
	classification: 'WRITE',
	displayName: 'Create Conversation from Contact',
	description: 'Starts a new conversation with a first message written as the contact.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Starts a new inbox conversation whose first message is authored by the contact (as if they wrote in), by Intercom contact ID. It does not message the contact; use Send Message to Contact for an outbound admin message and Reply to Conversation (by ID) to answer an existing thread. Returns the message with its conversation_id. Each call opens another conversation, so retries duplicate.',
		idempotent: false,
	},
	props: {
		contactId: Property.ShortText({
			displayName: 'Contact ID',
			description: 'The Intercom contact ID (user or lead).',
			required: true,
		}),
		body: Property.LongText({
			displayName: 'Message Body',
			description: 'Plain text; HTML is not supported here.',
			required: true,
		}),
	},
	outputSchema: messageOutputSchema,
	async run(context) {
		const contactId = requireText({ label: 'Contact ID', value: context.propsValue.contactId });
		const body = requireText({ label: 'Message Body', value: context.propsValue.body });
		const contact = await resolveContact({ auth: context.auth, lookupBy: 'id', value: contactId });
		return intercomRequest<Record<string, unknown>>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: ['conversations'],
			body: { from: { type: contact['role'] === 'lead' ? 'lead' : 'user', id: String(contact['id']) }, body },
			operation: 'create the conversation',
		});
	},
});
