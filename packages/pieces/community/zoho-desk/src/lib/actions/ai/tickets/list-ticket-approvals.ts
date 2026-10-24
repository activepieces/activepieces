import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListTicketApprovalsOutputSchema } from '../../../output-schemas';

export const zohoDeskListTicketApprovalsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_ticket_approvals',
	outputSchema: zohoDeskListTicketApprovalsOutputSchema,
	displayName: 'List Ticket Approvals',
	description: 'Lists approval requests on a ticket.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the approval requests on one ticket, optionally only Pending, Approved or Rejected ones.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketId: zohoDeskAiProps.ticketId({ required: true }),
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Only approvals with this status.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Pending', value: 'Pending' },
					{ label: 'Approved', value: 'Approved' },
					{ label: 'Rejected', value: 'Rejected' },
				],
			},
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, ticketId, status, from, limit } = context.propsValue;
		const approvals = await zohoDeskApi.listTicketApprovals({
			auth: context.auth,
			orgId,
			ticketId,
			status,
			from,
			limit,
		});
		return { approvals, count: approvals.length };
	},
});
