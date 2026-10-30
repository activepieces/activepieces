import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskSearchTicketsOutputSchema } from '../../../output-schemas';

export const zohoDeskSearchTicketsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_search_tickets',
	outputSchema: zohoDeskSearchTicketsOutputSchema,
	displayName: 'Search Tickets',
	description: 'Searches tickets by text, ticket number, email, contact, account or date range.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Searches tickets across the organization by free text (supports a trailing * wildcard), ticket number, requester email or phone, contact, account, assignee, status, priority or time range. Use it to resolve a ticket number like "#123" to a ticket ID. Page with From and Limit.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		searchText: Property.ShortText({
			displayName: 'Search Text',
			description:
				'Free text matched across ticket fields; end with * for a prefix match, e.g. "refund*".',
			required: false,
		}),
		ticketNumber: Property.ShortText({
			displayName: 'Ticket Number',
			description: 'Ticket number without "#", e.g. "123".',
			required: false,
		}),
		subject: Property.ShortText({
			displayName: 'Subject',
			description: 'Text to match in the subject.',
			required: false,
		}),
		email: Property.ShortText({
			displayName: 'Email',
			description: 'Requester email.',
			required: false,
		}),
		phone: Property.ShortText({
			displayName: 'Phone',
			description: 'Requester phone.',
			required: false,
		}),
		contactId: zohoDeskAiProps.contactId({ required: false }),
		accountId: zohoDeskAiProps.accountId({ required: false }),
		assigneeId: Property.ShortText({
			displayName: 'Assignee ID',
			description: 'Agent ID (from List Agents).',
			required: false,
		}),
		departmentId: zohoDeskAiProps.departmentId({ required: false }),
		status: Property.ShortText({
			displayName: 'Status',
			description:
				'Ticket status name, e.g. "Open", "On Hold", "Escalated" or "Closed". Custom statuses are listed by List Fields (module tickets, field status).',
			required: false,
		}),
		priority: Property.ShortText({
			displayName: 'Priority',
			description: 'Priority name, e.g. "High".',
			required: false,
		}),
		createdTimeRange: Property.ShortText({
			displayName: 'Created Time Range',
			description:
				'Two ISO 8601 times separated by a comma, e.g. "2024-01-01T00:00:00.000Z,2024-01-31T23:59:59.000Z".',
			required: false,
		}),
		modifiedTimeRange: Property.ShortText({
			displayName: 'Modified Time Range',
			description: 'Two ISO 8601 times separated by a comma.',
			required: false,
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const {
			orgId,
			searchText,
			ticketNumber,
			subject,
			email,
			phone,
			contactId,
			accountId,
			assigneeId,
			departmentId,
			status,
			priority,
			createdTimeRange,
			modifiedTimeRange,
			from,
			limit,
		} = context.propsValue;
		const tickets = await zohoDeskApi.searchTickets({
			auth: context.auth,
			orgId,
			searchText,
			ticketNumber,
			subject,
			email,
			phone,
			contactId,
			accountId,
			assigneeId,
			departmentId,
			status,
			priority,
			createdTimeRange,
			modifiedTimeRange,
			from,
			limit,
		});
		return { tickets, count: tickets.length };
	},
});
