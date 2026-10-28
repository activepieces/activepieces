import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskCreateTicketCommentOutputSchema } from '../../../output-schemas';

export const zohoDeskUpdateTicketCommentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_update_ticket_comment',
	outputSchema: zohoDeskCreateTicketCommentOutputSchema,
	displayName: 'Update Ticket Comment',
	description: 'Edits a comment on a ticket.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Replaces the text of one ticket comment, and optionally its visibility.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketId: zohoDeskAiProps.ticketId({ required: true }),
		commentId: Property.ShortText({
			displayName: 'Comment ID',
			description: 'Comment ID (from List Ticket Comments).',
			required: true,
		}),
		content: Property.LongText({
			displayName: 'Content',
			description: 'New comment text.',
			required: true,
		}),
		isPublic: zohoDeskAiProps.yesNo({
			required: false,
			displayName: 'Is Public',
			description: 'Yes shows the comment to the contact; No keeps it agent-only.',
		}),
		contentType: Property.StaticDropdown({
			displayName: 'Content Type',
			description: 'Format of Content.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'html', value: 'html' },
					{ label: 'plainText', value: 'plainText' },
				],
			},
		}),
	},
	async run(context) {
		const { orgId, ticketId, commentId, content, isPublic, contentType } = context.propsValue;
		return await zohoDeskApi.updateTicketComment({
			auth: context.auth,
			orgId,
			ticketId,
			commentId,
			content,
			isPublic,
			contentType,
		});
	},
});
