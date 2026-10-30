import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUpdateTicketApprovalOutputSchema } from '../../../output-schemas';

export const zohoDeskUpdateTicketApprovalAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_update_ticket_approval',
	outputSchema: zohoDeskUpdateTicketApprovalOutputSchema,
	displayName: 'Approve Or Reject Ticket Approval',
	description: 'Approves or rejects an approval request on a ticket.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Approves or rejects one pending approval request on a ticket. Only an agent named as its approver can do this.',
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
		status: Property.StaticDropdown({
			displayName: 'Decision',
			description: 'Approved or Rejected.',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'Approved', value: 'Approved' },
					{ label: 'Rejected', value: 'Rejected' },
				],
			},
		}),
	},
	async run(context) {
		const { orgId, ticketId, approvalId, status } = context.propsValue;
		return await zohoDeskApi.updateTicketApproval({
			auth: context.auth,
			orgId,
			ticketId,
			approvalId,
			status,
		});
	},
});
