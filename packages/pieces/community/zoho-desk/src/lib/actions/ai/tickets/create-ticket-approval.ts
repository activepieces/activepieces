import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskCreateTicketApprovalOutputSchema } from '../../../output-schemas';

export const zohoDeskCreateTicketApprovalAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_create_ticket_approval',
	outputSchema: zohoDeskCreateTicketApprovalOutputSchema,
	displayName: 'Create Ticket Approval',
	description: 'Requests approval on a ticket from agents.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates an approval request on one ticket, sent to the given approver agents (from List Agents). Not idempotent: each call creates a new request.',
		idempotent: false,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketId: zohoDeskAiProps.ticketId({ required: true }),
		approverIds: Property.Array({
			displayName: 'Approver IDs',
			description: 'Agent IDs who can approve.',
			required: true,
		}),
		subject: Property.ShortText({
			displayName: 'Subject',
			description: 'What is being approved.',
			required: true,
		}),
		description: Property.LongText({
			displayName: 'Description',
			description: 'Details for the approver.',
			required: false,
		}),
	},
	async run(context) {
		const { orgId, ticketId, approverIds, subject, description } = context.propsValue;
		return await zohoDeskApi.createTicketApproval({
			auth: context.auth,
			orgId,
			ticketId,
			approverIds: zohoDeskUtils.requiredStringList({
				value: approverIds,
				propName: 'Approver IDs',
			}),
			subject,
			description,
		});
	},
});
