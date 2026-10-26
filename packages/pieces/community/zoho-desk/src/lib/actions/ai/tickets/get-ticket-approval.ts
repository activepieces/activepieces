import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskGetTicketApprovalOutputSchema } from '../../../output-schemas';

export const zohoDeskGetTicketApprovalAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_ticket_approval',
	outputSchema: zohoDeskGetTicketApprovalOutputSchema,
	displayName: 'Get Ticket Approval',
	description: 'Gets one approval request on a ticket.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one approval request on a ticket, with its status, requester, approver and timestamps.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketId: zohoDeskAiProps.ticketId({ required: true }),
		approvalId: Property.ShortText({
			displayName: 'Approval ID',
			description: 'Approval ID (from List Ticket Approvals).',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, ticketId, approvalId } = context.propsValue;
		return await zohoDeskApi.getTicketApproval({ auth: context.auth, orgId, ticketId, approvalId });
	},
});
