import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListTicketTasksOutputSchema } from '../../../output-schemas';

export const zohoDeskListTicketTasksAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_ticket_tasks',
	outputSchema: zohoDeskListTicketTasksOutputSchema,
	displayName: 'List Ticket Tasks',
	description: 'Lists the tasks on a ticket.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Lists the tasks linked to one ticket, optionally only completed or open ones.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketId: zohoDeskAiProps.ticketId({ required: true }),
		isCompleted: zohoDeskAiProps.yesNo({
			required: false,
			displayName: 'Is Completed',
			description: 'Yes returns only completed tasks, No only open ones.',
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
					{ label: 'modifiedTime', value: 'modifiedTime' },
					{ label: 'priority', value: 'priority' },
					{ label: 'status', value: 'status' },
					{ label: 'subject', value: 'subject' },
					{ label: 'category', value: 'category' },
				],
			},
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, ticketId, isCompleted, sortBy, from, limit } = context.propsValue;
		const tasks = await zohoDeskApi.listTicketTasks({
			auth: context.auth,
			orgId,
			ticketId,
			isCompleted,
			sortBy,
			from,
			limit,
		});
		return { tasks, count: tasks.length };
	},
});
