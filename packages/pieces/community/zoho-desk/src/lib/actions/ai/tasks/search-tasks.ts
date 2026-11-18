import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskSearchTasksOutputSchema } from '../../../output-schemas';

export const zohoDeskSearchTasksAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_search_tasks',
	outputSchema: zohoDeskSearchTasksOutputSchema,
	displayName: 'Search Tasks',
	description: 'Searches tasks by text, subject, ticket number, status or time range.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Searches tasks by free text (supports a trailing * wildcard), subject, ticket number, assignee, status, priority or time range. Page with From and Limit.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		searchText: Property.ShortText({
			displayName: 'Search Text',
			description: 'Free text matched across task fields; end with * for a prefix match.',
			required: false,
		}),
		subject: Property.ShortText({
			displayName: 'Subject',
			description: 'Text to match in the subject.',
			required: false,
		}),
		ticketNumber: Property.ShortText({
			displayName: 'Ticket Number',
			description: 'Number of the ticket the task belongs to.',
			required: false,
		}),
		assigneeId: Property.ShortText({
			displayName: 'Assignee ID',
			description: 'Agent ID (from List Agents).',
			required: false,
		}),
		departmentId: zohoDeskAiProps.departmentId({ required: false }),
		status: Property.ShortText({
			displayName: 'Status',
			description: 'Task status.',
			required: false,
		}),
		priority: Property.ShortText({
			displayName: 'Priority',
			description: 'Task priority.',
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
			description:
				'Two ISO 8601 times separated by a comma, e.g. "2024-01-01T00:00:00.000Z,2024-01-31T23:59:59.000Z".',
			required: false,
		}),
		dueDateRange: Property.ShortText({
			displayName: 'Due Date Range',
			description:
				'Two ISO 8601 times separated by a comma, e.g. "2024-01-01T00:00:00.000Z,2024-01-31T23:59:59.000Z".',
			required: false,
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const {
			orgId,
			searchText,
			subject,
			ticketNumber,
			assigneeId,
			departmentId,
			status,
			priority,
			createdTimeRange,
			modifiedTimeRange,
			dueDateRange,
			from,
			limit,
		} = context.propsValue;
		const tasks = await zohoDeskApi.searchTasks({
			auth: context.auth,
			orgId,
			searchText,
			subject,
			ticketNumber,
			assigneeId,
			departmentId,
			status,
			priority,
			createdTimeRange,
			modifiedTimeRange,
			dueDateRange,
			from,
			limit,
		});
		return { tasks, count: tasks.length };
	},
});
