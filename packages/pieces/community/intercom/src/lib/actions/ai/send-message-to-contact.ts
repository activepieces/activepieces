import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomAuth } from '../../auth';
import { intercomRequest } from '../../common';
import { resolveAdminId } from '../../common/client';
import { requireText, resolveContact } from '../../common/lookups';
import { messageOutputSchema } from '../../output-schemas';

export const sendMessageToContactAction = createAction({
	auth: intercomAuth,
	name: 'send_message_to_contact',
	classification: 'WRITE',
	displayName: 'Send Message to Contact',
	description: 'Sends a new email or in-app message from an admin to one contact.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Sends a new outbound email or in-app message from an admin to one contact (by contact ID or a unique email); it reaches a real person. Use Reply to Conversation (by ID) to answer inside an existing conversation. Each call sends again, so retries duplicate.',
		idempotent: false,
	},
	props: {
		contactId: Property.ShortText({
			displayName: 'Contact ID',
			description: 'The Intercom contact ID. Give either Contact ID or Contact Email.',
			required: false,
		}),
		email: Property.ShortText({
			displayName: 'Contact Email',
			description: 'Used when no Contact ID is given. Fails if several contacts share this email.',
			required: false,
		}),
		messageType: Property.StaticDropdown({
			displayName: 'Message Type',
			required: true,
			defaultValue: 'email',
			options: {
				disabled: false,
				options: [
					{ label: 'Email', value: 'email' },
					{ label: 'In-App', value: 'in_app' },
				],
			},
		}),
		subject: Property.ShortText({
			displayName: 'Subject',
			description: 'Required for email.',
			required: false,
		}),
		template: Property.StaticDropdown({
			displayName: 'Email Template',
			required: false,
			defaultValue: 'plain',
			options: {
				disabled: false,
				options: [
					{ label: 'Plain', value: 'plain' },
					{ label: 'Personal', value: 'personal' },
				],
			},
		}),
		body: Property.LongText({
			displayName: 'Message',
			description: 'The message text. Simple HTML is allowed.',
			required: true,
		}),
		adminId: Property.ShortText({
			displayName: 'From Admin ID',
			description: 'The sending admin. Leave empty to send as the admin who owns this connection.',
			required: false,
		}),
		openConversation: Property.Checkbox({
			displayName: 'Open Conversation Right Away',
			description: 'Open a conversation in the inbox without waiting for the contact to reply.',
			required: false,
			defaultValue: false,
		}),
	},
	outputSchema: messageOutputSchema,
	async run(context) {
		const { contactId, email, messageType, subject, template, openConversation } = context.propsValue;
		const body = requireText({ label: 'Message', value: context.propsValue.body });
		const isEmail = messageType !== 'in_app';
		if (isEmail && !subject?.trim()) {
			throw new Error('Subject is required for an email message.');
		}
		const hasId = Boolean(contactId?.trim());
		const hasEmail = Boolean(email?.trim());
		if (hasId === hasEmail) {
			throw new Error('Give exactly one of Contact ID or Contact Email.');
		}
		const contact = await resolveContact({
			auth: context.auth,
			lookupBy: hasId ? 'id' : 'email',
			value: hasId ? contactId ?? '' : email ?? '',
		});
		const adminId = await resolveAdminId({ auth: context.auth, adminId: context.propsValue.adminId });
		return intercomRequest<Record<string, unknown>>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: ['messages'],
			body: {
				message_type: isEmail ? 'email' : IN_APP_WIRE_VALUE,
				subject: isEmail ? subject?.trim() : undefined,
				template: isEmail ? template || 'plain' : undefined,
				body,
				from: { type: 'admin', id: Number(adminId) },
				to: { type: contact['role'] === 'user' ? 'user' : 'lead', id: String(contact['id']) },
				create_conversation_without_contact_reply: openConversation === true,
			},
			operation: 'send the message',
		});
	},
});

const IN_APP_WIRE_VALUE = 'inapp';
