import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskGetTaskOutputSchema } from '../../../output-schemas';

export const zohoDeskCreateTaskAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_create_task',
	outputSchema: zohoDeskGetTaskOutputSchema,
	displayName: 'Create Task',
	description: 'Creates a task.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a task in a department, optionally on a ticket and assigned to an agent. Not idempotent: each call creates a new task.',
		idempotent: false,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		subject: Property.ShortText({
			displayName: 'Subject',
			description: 'Task subject.',
			required: true,
		}),
		departmentId: zohoDeskAiProps.departmentId({ required: true }),
		ticketId: zohoDeskAiProps.ticketId({
			required: false,
			description: 'Ticket the task belongs to (from List Tickets).',
		}),
		contactId: zohoDeskAiProps.contactId({ required: false }),
		ownerId: Property.ShortText({
			displayName: 'Owner ID',
			description: 'Agent ID the task is assigned to (from List Agents).',
			required: false,
		}),
		dueDate: Property.DateTime({
			displayName: 'Due Date',
			description: 'Due date, ISO 8601.',
			required: false,
		}),
		status: Property.ShortText({
			displayName: 'Status',
			description: 'Task status, e.g. "Not Started", "In Progress" or "Completed".',
			required: false,
		}),
		priority: Property.ShortText({
			displayName: 'Priority',
			description: 'Priority, e.g. "Low", "Normal" or "High".',
			required: false,
		}),
		category: Property.ShortText({
			displayName: 'Category',
			description: 'Task category.',
			required: false,
		}),
		description: Property.LongText({
			displayName: 'Description',
			description: 'Task details.',
			required: false,
		}),
		customFields: Property.Object({
			displayName: 'Custom Fields',
			description: 'Custom field values keyed by API name (from List Fields, module tasks).',
			required: false,
		}),
	},
	async run(context) {
		const {
			orgId,
			subject,
			departmentId,
			ticketId,
			contactId,
			ownerId,
			dueDate,
			status,
			priority,
			category,
			description,
			customFields,
		} = context.propsValue;
		return await zohoDeskApi.createTask({
			auth: context.auth,
			orgId,
			subject,
			departmentId,
			ticketId,
			contactId,
			ownerId,
			dueDate,
			status,
			priority,
			category,
			description,
			customFields,
		});
	},
});
