import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskSendTicketReplyOutputSchema } from '../../../output-schemas';

export const zohoDeskSendTicketReplyAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_send_ticket_reply',
	outputSchema: zohoDeskSendTicketReplyOutputSchema,
	displayName: 'Send Ticket Reply',
	description: 'Sends an email reply on a ticket.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Sends an email reply to the customer on one ticket, from one of the department's From addresses (List Reply Addresses). The email goes out immediately; use Create Draft Reply to leave it for a human to review. Not idempotent: each call sends another email.",
		idempotent: false,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketId: zohoDeskAiProps.ticketId({ required: true }),
		content: Property.LongText({
			displayName: 'Content',
			description: 'Reply body. HTML unless Content Type is plainText.',
			required: true,
		}),
		fromEmailAddress: Property.ShortText({
			displayName: 'From Address',
			description:
				"Sender address; must be one of the department's From addresses (from List Reply Addresses).",
			required: true,
		}),
		to: Property.ShortText({
			displayName: 'To',
			description:
				"Recipient email addresses, comma-separated. Defaults to the ticket's contact when empty.",
			required: false,
		}),
		cc: Property.ShortText({
			displayName: 'CC',
			description: 'CC email addresses, comma-separated.',
			required: false,
		}),
		bcc: Property.ShortText({
			displayName: 'BCC',
			description: 'BCC email addresses, comma-separated.',
			required: false,
		}),
		contentType: Property.StaticDropdown({
			displayName: 'Content Type',
			description: 'Format of Content. Defaults to html.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'html', value: 'html' },
					{ label: 'plainText', value: 'plainText' },
				],
			},
		}),
		inReplyToThreadId: Property.ShortText({
			displayName: 'In Reply To Thread ID',
			description: 'Thread ID being answered (from List Ticket Threads).',
			required: false,
		}),
		ticketStatus: Property.ShortText({
			displayName: 'Ticket Status After Reply',
			description: 'Status to set on the ticket after sending, e.g. "On Hold" or "Closed".',
			required: false,
		}),
	},
	async run(context) {
		const {
			orgId,
			ticketId,
			content,
			fromEmailAddress,
			to,
			cc,
			bcc,
			contentType,
			inReplyToThreadId,
			ticketStatus,
		} = context.propsValue;
		return await zohoDeskApi.sendTicketReply({
			auth: context.auth,
			orgId,
			ticketId,
			content,
			fromEmailAddress,
			to,
			cc,
			bcc,
			contentType,
			inReplyToThreadId,
			ticketStatus,
		});
	},
});
