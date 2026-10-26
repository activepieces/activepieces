import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskCreateDraftReplyOutputSchema } from '../../../output-schemas';

export const zohoDeskCreateDraftReplyAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_create_draft_reply',
	outputSchema: zohoDeskCreateDraftReplyOutputSchema,
	displayName: 'Create Draft Reply',
	description: 'Saves an email reply on a ticket as a draft.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Saves an email reply on one ticket as a draft for an agent to review and send; nothing is emailed. Not idempotent: each call creates another draft.',
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
		} = context.propsValue;
		return await zohoDeskApi.createDraftReply({
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
		});
	},
});
