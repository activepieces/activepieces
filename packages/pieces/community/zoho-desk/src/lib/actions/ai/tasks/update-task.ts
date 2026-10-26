import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskGetTaskOutputSchema } from '../../../output-schemas';

export const zohoDeskUpdateTaskAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_update_task',
	outputSchema: zohoDeskGetTaskOutputSchema,
	displayName: 'Update Task',
	description: 'Updates fields on a task.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates only the fields you set on one task (status, owner, due date, …); fields left empty are not changed.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		taskId: zohoDeskAiProps.taskId({ required: true }),
		subject: Property.ShortText({
			displayName: 'Subject',
			description: 'Task subject.',
			required: false,
		}),
		departmentId: zohoDeskAiProps.departmentId({ required: false }),
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
			taskId,
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
		return await zohoDeskApi.updateTask({
			auth: context.auth,
			orgId,
			taskId,
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
