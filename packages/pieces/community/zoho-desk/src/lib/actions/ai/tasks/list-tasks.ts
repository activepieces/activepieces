import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskListTasksOutputSchema } from '../../../output-schemas';

export const zohoDeskListTasksAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_tasks',
	outputSchema: zohoDeskListTasksOutputSchema,
	displayName: 'List Tasks',
	description: 'Lists tasks.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			"Lists tasks across tickets, optionally by department, view, assignee or completion. Use List Ticket Tasks for one ticket's tasks. Page with From and Limit.",
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		departmentId: zohoDeskAiProps.departmentId({ required: false }),
		viewId: Property.ShortText({
			displayName: 'View ID',
			description: 'Task view ID (from List Views, module tasks).',
			required: false,
		}),
		assignee: Property.Array({
			displayName: 'Assignee',
			description: 'Agent IDs (from List Agents) to include.',
			required: false,
		}),
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
		const { orgId, departmentId, viewId, assignee, isCompleted, sortBy, from, limit } =
			context.propsValue;
		const tasks = await zohoDeskApi.listTasks({
			auth: context.auth,
			orgId,
			departmentId,
			viewId,
			assignee: zohoDeskUtils.optionalStringList({ value: assignee, propName: 'Assignee' }),
			isCompleted,
			sortBy,
			from,
			limit,
		});
		return { tasks, count: tasks.length };
	},
});
