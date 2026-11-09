import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListTicketHistoryOutputSchema } from '../../../output-schemas';

export const zohoDeskListTicketHistoryAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_ticket_history',
	outputSchema: zohoDeskListTicketHistoryOutputSchema,
	displayName: 'List Ticket History',
	description: 'Lists the change history of a ticket.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the audit history of one ticket: field changes, comments, attachments and other events, with who did them and when. Narrow it with Event Filter, Field Name or Agent ID.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketId: zohoDeskAiProps.ticketId({ required: true }),
		agentId: zohoDeskAiProps.agentId({
			required: false,
			description: 'Only events by this agent (from List Agents).',
		}),
		fieldName: Property.ShortText({
			displayName: 'Field Name',
			description: 'Only changes to this field, by API name.',
			required: false,
		}),
		eventFilter: Property.StaticDropdown({
			displayName: 'Event Filter',
			description: 'Only this kind of event.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'CommentHistory', value: 'CommentHistory' },
					{ label: 'TimeEntryHistory', value: 'TimeEntryHistory' },
					{ label: 'TaskHistory', value: 'TaskHistory' },
					{ label: 'CallHistory', value: 'CallHistory' },
					{ label: 'EventHistory', value: 'EventHistory' },
					{ label: 'AttachmentHistory', value: 'AttachmentHistory' },
					{ label: 'ApprovalHistory', value: 'ApprovalHistory' },
					{ label: 'SuperviseHistory', value: 'SuperviseHistory' },
				],
			},
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, ticketId, agentId, fieldName, eventFilter, from, limit } = context.propsValue;
		const history = await zohoDeskApi.listTicketHistory({
			auth: context.auth,
			orgId,
			ticketId,
			agentId,
			fieldName,
			eventFilter,
			from,
			limit,
		});
		return { history, count: history.length };
	},
});
