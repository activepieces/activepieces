import { intercomAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomClient } from '../common';
import { contactOptionsForRoles } from '../common/props';
import { messageOutputSchema } from '../output-schemas';

export const createConversationAction = createAction({
	auth: intercomAuth,
	name: 'create-conversation',
	classification: 'WRITE',
	displayName: 'Create Conversation',
	description: 'Creates a new conversation from a contact.',
	audience: 'human',
	aiMetadata: {
		description:
			'Start a new Intercom conversation on behalf of an existing contact by sending an initial message body from that contact. Pick this to open a fresh thread tied to a known user or lead; it does not reply to or search existing conversations. Requires a valid contact ID and the matching contact type (user or lead). Not idempotent — each call creates a separate conversation.',
		idempotent: false,
	},
	props: {
		contactType: Property.StaticDropdown({
			displayName: 'Contact Type',
			required: true,
			defaultValue: 'user',
			options: {
				disabled: false,
				options: [
					{ value: 'user', label: 'User' },
					{ value: 'lead', label: 'Lead' },
				],
			},
		}),
		contactId: Property.Dropdown({
			auth: intercomAuth,
			displayName: 'Contact ID',
			required: true,
			refreshers: ['contactType'],
			options: async ({ auth, contactType }) => {
				if (!auth || !contactType) {
					return {
						options: [],
						disabled: true,
						placeholder: 'Please connect your account first.',
					};
				}

				return contactOptionsForRoles({ auth: auth, roles: [String(contactType)] });
			},
		}),
		body: Property.LongText({
			displayName: 'Message Body',
			required: true,
		}),
	},
	outputSchema: messageOutputSchema,
	async run(context) {
		const { contactId, body, contactType } = context.propsValue;

		const client = await intercomClient(context.auth);

		const response = await client.conversations.create({
			body,
			from: {
				type: contactType as 'lead' | 'user' | 'contact',
				id: contactId,
			},
		});

		return response;
	},
});
