import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskCreateTicketCommentOutputSchema } from '../../../output-schemas';

export const zohoDeskGetTicketCommentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_ticket_comment',
	outputSchema: zohoDeskCreateTicketCommentOutputSchema,
	displayName: 'Get Ticket Comment',
	description: 'Gets one comment on a ticket.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets one comment on a ticket, with its author, visibility and attachments.',
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
	},
	async run(context) {
		const { orgId, ticketId, commentId } = context.propsValue;
		return await zohoDeskApi.getTicketComment({ auth: context.auth, orgId, ticketId, commentId });
	},
});
