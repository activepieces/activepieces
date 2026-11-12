import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { taskFields } from '../../common/task-fields';
import { ticktickSearchTasksOutputSchema } from '../../output-schemas';

export const searchTasksAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_search_tasks',
	outputSchema: ticktickSearchTasksOutputSchema,
	displayName: 'Search Tasks',
	description: 'Searches TickTick tasks by keyword with optional project, tag, status and due-date filters.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Keyword search across tasks, optionally narrowed by projectIds, tags, status and a due-date window. Use to resolve a task name into its id and projectId. A blank keyword returns nothing, so omit it to search by filters only. Read-only.',
		idempotent: true,
	},
	props: {
		keywords: Property.ShortText({
			displayName: 'Keywords',
			description: 'Text to search for.',
			required: false,
		}),
		projectIds: Property.Array({
			displayName: 'Project IDs',
			description: 'Only search in these projects, from the List Projects action.',
			required: false,
		}),
		tags: Property.Array({
			displayName: 'Tags',
			required: false,
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
		dueFrom: Property.DateTime({
			displayName: 'Due From',
			description: 'Only tasks due on or after this time.',
			required: false,
		}),
		dueTo: Property.DateTime({
			displayName: 'Due To',
			description: 'Only tasks due on or before this time.',
			required: false,
		}),
	},
	async run(context) {
		const { keywords, projectIds, tags, status, dueFrom, dueTo } = context.propsValue;
		const projectIdList = taskFields.toStringArray({ value: projectIds });
		const tagList = taskFields.toStringArray({ value: tags });
		const tasks = await tickTickApiCall<Record<string, unknown>[]>({
			accessToken: context.auth.access_token,
			method: HttpMethod.POST,
			resourceUri: '/task/search',
			body: {
				...(keywords ? { keywords } : {}),
				...(projectIdList && projectIdList.length > 0 ? { projectIds: projectIdList } : {}),
				...(tagList && tagList.length > 0 ? { tags: tagList } : {}),
				...(status && status.length > 0 ? { status } : {}),
				...(dueFrom ? { dueFrom: taskFields.formatDate({ value: dueFrom }) } : {}),
				...(dueTo ? { dueTo: taskFields.formatDate({ value: dueTo }) } : {}),
			},
		});
		return { tasks, count: tasks.length };
	},
});
