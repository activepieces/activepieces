import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskListTicketsOutputSchema } from '../../../output-schemas';

export const zohoDeskListTicketsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_tickets',
	outputSchema: zohoDeskListTicketsOutputSchema,
	displayName: 'List Tickets',
	description:
		'Lists tickets, optionally filtered by department, view, status, priority, assignee or channel.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists tickets in an organization, filtered by department, view, status, priority, assignee or channel. Use Search Tickets to match text, email, phone or ticket number instead. Page with From and Limit.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		departmentId: zohoDeskAiProps.departmentId({
			required: false,
			description: 'Only tickets in this department (from List Departments).',
		}),
		viewId: Property.ShortText({
			displayName: 'View ID',
			description:
				'Predefined or custom view ID (from List Views). A single-department view also needs its Department ID.',
			required: false,
		}),
		status: Property.Array({
			displayName: 'Status',
			description: 'Status names to include, e.g. ["Open", "On Hold"].',
			required: false,
		}),
		priority: Property.Array({
			displayName: 'Priority',
			description: 'Priorities to include, e.g. ["High", "Urgent"].',
			required: false,
		}),
		assignee: Property.Array({
			displayName: 'Assignee',
			description: 'Agent IDs (from List Agents) to include, or ["Unassigned"].',
			required: false,
		}),
		channel: Property.Array({
			displayName: 'Channel',
			description: 'Channels to include, e.g. ["Email", "Web", "Phone"].',
			required: false,
		}),
		receivedInDays: Property.StaticDropdown({
			displayName: 'Received In Days',
			description: 'Only tickets received in the last 15, 30 or 90 days.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: '15', value: '15' },
					{ label: '30', value: '30' },
					{ label: '90', value: '90' },
				],
			},
		}),
		sortBy: Property.StaticDropdown({
			displayName: 'Sort By',
			description: 'Field to sort by.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'dueDate', value: 'dueDate' },
					{ label: 'createdTime', value: 'createdTime' },
					{ label: 'recentThread', value: 'recentThread' },
				],
			},
		}),
		include: Property.StaticMultiSelectDropdown({
			displayName: 'Include',
			description: 'Related data to embed in each ticket.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'contacts', value: 'contacts' },
					{ label: 'products', value: 'products' },
					{ label: 'departments', value: 'departments' },
					{ label: 'team', value: 'team' },
					{ label: 'assignee', value: 'assignee' },
				],
			},
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const {
			orgId,
			departmentId,
			viewId,
			status,
			priority,
			assignee,
			channel,
			receivedInDays,
			sortBy,
			include,
			from,
			limit,
		} = context.propsValue;
		const tickets = await zohoDeskApi.listTicketsByFilter({
			auth: context.auth,
			orgId,
			departmentId,
			viewId,
			status: zohoDeskUtils.optionalStringList({ value: status, propName: 'Status' }),
			priority: zohoDeskUtils.optionalStringList({ value: priority, propName: 'Priority' }),
			assignee: zohoDeskUtils.optionalStringList({ value: assignee, propName: 'Assignee' }),
			channel: zohoDeskUtils.optionalStringList({ value: channel, propName: 'Channel' }),
			receivedInDays,
			sortBy,
			include,
			from,
			limit,
		});
		return { tickets, count: tickets.length };
	},
});
