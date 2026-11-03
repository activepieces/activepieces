import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomAuth } from '../auth';
import { intercomRequest } from '../common';
import { resolveAdminId } from '../common/client';
import { attachmentUrlList, requireText } from '../common/lookups';
import { ticketReplyOutputSchema } from '../output-schemas';

export const replyToTicketAction = createAction({
	auth: intercomAuth,
	name: 'reply_to_ticket',
	classification: 'WRITE',
	displayName: 'Reply to Ticket',
	description: 'Adds an admin reply or an internal note to a ticket.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Adds an admin reply (customer-visible on shared Customer tickets) or an internal note to a ticket by ticket ID. Tracker and unshared back-office tickets only accept notes. Each call adds another part, so retries duplicate.',
		idempotent: false,
	},
	props: {
		ticketId: Property.ShortText({
			displayName: 'Ticket ID',
			description: 'The ticket "id" from Intercom, not the inbox ticket number.',
			required: true,
		}),
		messageType: Property.StaticDropdown({
			displayName: 'Reply Type',
			required: true,
			defaultValue: 'note',
			options: {
				disabled: false,
				options: [
					{ label: 'Internal Note', value: 'note' },
					{ label: 'Reply to Customer', value: 'comment' },
				],
			},
		}),
		body: Property.LongText({ displayName: 'Text', required: true }),
		adminId: Property.ShortText({
			displayName: 'Admin ID',
			description: 'Leave empty to reply as the admin who owns this connection.',
			required: false,
		}),
		attachmentUrls: Property.Array({
			displayName: 'Attachment URLs',
			description: 'Up to 10 public image URLs to attach.',
			required: false,
		}),
	},
	outputSchema: ticketReplyOutputSchema,
	async run(context) {
		const ticketId = requireText({ label: 'Ticket ID', value: context.propsValue.ticketId });
		const body = requireText({ label: 'Text', value: context.propsValue.body });
		const messageType = context.propsValue.messageType === 'comment' ? 'comment' : 'note';
		const attachmentUrls = attachmentUrlList(context.propsValue.attachmentUrls);
		const adminId = await resolveAdminId({ auth: context.auth, adminId: context.propsValue.adminId });
		return intercomRequest<Record<string, unknown>>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: ['tickets', ticketId, 'reply'],
			body: { message_type: messageType, type: 'admin', admin_id: adminId, body, attachment_urls: attachmentUrls },
			operation: 'reply to the ticket',
		});
	},
});
