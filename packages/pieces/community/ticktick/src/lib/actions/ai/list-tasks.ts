import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import {
	TICKTICK_PRIORITY_HIGH,
	TICKTICK_PRIORITY_LOW,
	TICKTICK_PRIORITY_MEDIUM,
	TICKTICK_PRIORITY_NONE,
} from '../../common/constants';
import { taskFields } from '../../common/task-fields';
import { ticktickListTasksOutputSchema } from '../../output-schemas';

export const listTasksAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_list_tasks',
	outputSchema: ticktickListTasksOutputSchema,
	displayName: 'List Tasks',
	description: 'Lists TickTick tasks matching project, date, priority, tag, kind and status filters.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Single-call task filter returning at most 200 tasks. Filters: projectIds, startDate/endDate (on the task start date), priority, tag (tasks must have all given tags), kind, status. Use ticktick_search_tasks for keyword search and ticktick_list_completed_tasks to filter on completion time. Read-only.',
		idempotent: true,
	},
	props: {
		projectIds: Property.Array({
			displayName: 'Project IDs',
			description: 'Only tasks in these projects, from the List Projects action.',
			required: false,
		}),
		startDate: Property.DateTime({
			displayName: 'Start Date From',
			description: 'Only tasks whose start date is on or after this time.',
			required: false,
		}),
		endDate: Property.DateTime({
			displayName: 'Start Date To',
			description: 'Only tasks whose start date is on or before this time.',
			required: false,
		}),
		priority: Property.StaticMultiSelectDropdown({
			displayName: 'Priority',
			required: false,
			options: {
				options: [
					{ label: 'None', value: TICKTICK_PRIORITY_NONE },
					{ label: 'Low', value: TICKTICK_PRIORITY_LOW },
					{ label: 'Medium', value: TICKTICK_PRIORITY_MEDIUM },
					{ label: 'High', value: TICKTICK_PRIORITY_HIGH },
				],
			},
		}),
		tag: Property.Array({
			displayName: 'Tags',
			description: 'Only tasks that have all of these tags.',
			required: false,
		}),
		kind: Property.StaticMultiSelectDropdown({
			displayName: 'Kind',
			required: false,
			options: {
				options: [
					{ label: 'Text', value: 'TEXT' },
					{ label: 'Note', value: 'NOTE' },
					{ label: 'Checklist', value: 'CHECKLIST' },
				],
			},
		}),
		status: Property.StaticMultiSelectDropdown({
			displayName: 'Status',
			required: false,
			options: {
				options: [
					{ label: 'Open', value: 0 },
					{ label: 'Completed', value: 2 },
					{ label: 'Abandoned', value: -1 },
				],
			},
		}),
	},
	async run(context) {
		const { projectIds, startDate, endDate, priority, tag, kind, status } = context.propsValue;
		const projectIdList = taskFields.toStringArray({ value: projectIds });
		const tagList = taskFields.toStringArray({ value: tag });
		const tasks = await tickTickApiCall<Record<string, unknown>[]>({
			accessToken: context.auth.access_token,
			method: HttpMethod.POST,
			resourceUri: '/task/filter',
			body: {
				...(projectIdList && projectIdList.length > 0 ? { projectIds: projectIdList } : {}),
				...(startDate ? { startDate: taskFields.formatDate({ value: startDate }) } : {}),
				...(endDate ? { endDate: taskFields.formatDate({ value: endDate }) } : {}),
				...(priority && priority.length > 0 ? { priority } : {}),
				...(tagList && tagList.length > 0 ? { tag: tagList } : {}),
				...(kind && kind.length > 0 ? { kind } : {}),
				...(status && status.length > 0 ? { status } : {}),
			},
		});
		return { tasks, count: tasks.length };
	},
});
