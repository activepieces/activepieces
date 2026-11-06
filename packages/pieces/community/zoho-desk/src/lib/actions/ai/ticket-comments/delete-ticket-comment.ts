import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskDeleteTicketCommentOutputSchema } from '../../../output-schemas';

export const zohoDeskDeleteTicketCommentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_delete_ticket_comment',
	outputSchema: zohoDeskDeleteTicketCommentOutputSchema,
	displayName: 'Delete Ticket Comment',
	description: 'Deletes a comment from a ticket.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: { description: 'Permanently deletes one comment from a ticket.', idempotent: false },
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
	},
	async run(context) {
		const { orgId, ticketId, commentId } = context.propsValue;
		await zohoDeskApi.deleteTicketComment({ auth: context.auth, orgId, ticketId, commentId });
		return { success: true, ticketId, commentId };
	},
});
