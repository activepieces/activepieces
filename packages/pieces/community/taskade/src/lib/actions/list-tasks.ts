import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeAiProps } from '../common/ai-props';
import { taskadeApi } from '../common/client';
import { taskadeNormalize } from '../common/normalize';
import { TaskPageResponse } from '../common/types';
import { taskadeOutputSchemas } from '../output-schemas';

export const listTasksAction = createAction({
	auth: taskadeAuth,
	name: 'list_tasks',
	displayName: 'List Tasks',
	description: 'Lists the tasks of a project in outline order, one page at a time.',
	classification: 'SEARCH',
	audience: 'both',
	aiMetadata: {
		description:
			'Lists tasks of one Taskade project in outline order, one page at a time, with ID, text, parent task ID and completion. Use to get task IDs before updating, completing, moving or deleting; pass nextCursor as Cursor to continue. The first item of the first page is the project root (isRoot=true), not a real task. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		projectId: taskadeAiProps.projectId(),
		limit: taskadeAiProps.limit({ max: 1000, defaultValue: 100 }),
		cursor: Property.ShortText({
			displayName: 'Cursor',
			description: 'Pass nextCursor from the previous result to get the next page. Leave empty to start at the top.',
			required: false,
		}),
	},
	outputSchema: taskadeOutputSchemas['listTasks'],
	async run(context) {
		const { projectId, cursor } = context.propsValue;
		const limit = taskadeApi.validateInteger({ value: context.propsValue.limit, label: 'Limit', min: 1, max: 1000 }) ?? 100;
		const after = (cursor ?? '').trim();
		const response = await taskadeApi.request<TaskPageResponse>({
			token: context.auth.secret_text,
			method: HttpMethod.GET,
			path: `${taskadeApi.projectPath(projectId)}/tasks`,
			operation: 'list tasks',
			query: { limit, after: after.length > 0 ? after : undefined },
		});
		const items = (response.items ?? []).map((item) => taskadeNormalize.task(item));
		const hasMore = response.hasMore ?? items.length === limit;
		return { items, nextCursor: hasMore ? response.nextCursor ?? items[items.length - 1]?.id ?? null : null, hasMore };
	},
});
