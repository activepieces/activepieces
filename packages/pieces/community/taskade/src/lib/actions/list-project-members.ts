import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeAiProps } from '../common/ai-props';
import { taskadeApi } from '../common/client';
import { taskadeNormalize } from '../common/normalize';
import { ListAPIResponse, MemberResponse } from '../common/types';
import { taskadeOutputSchemas } from '../output-schemas';

export const listProjectMembersAction = createAction({
	auth: taskadeAuth,
	name: 'list_project_members',
	displayName: 'List Project Members',
	description: 'Lists the people who can be assigned to tasks in a project.',
	classification: 'SEARCH',
	audience: 'both',
	aiMetadata: {
		description:
			'Lists the members of one Taskade project with their handle and display name, one page at a time. Use to get the handle to pass to Assign Task; pass nextPage to continue. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		projectId: taskadeAiProps.projectId(),
		limit: taskadeAiProps.limit({ max: 100, defaultValue: 100 }),
		page: taskadeAiProps.page(),
	},
	outputSchema: taskadeOutputSchemas['listProjectMembers'],
	async run(context) {
		const projectId = taskadeApi.parseProjectId(context.propsValue.projectId);
		const limit = taskadeApi.validateInteger({ value: context.propsValue.limit, label: 'Limit', min: 1, max: 100 }) ?? 100;
		const page = taskadeApi.validateInteger({ value: context.propsValue.page, label: 'Page', min: 1, max: 100_000 }) ?? 1;
		const response = await taskadeApi.request<ListAPIResponse<MemberResponse | null>>({
			token: context.auth.secret_text,
			method: HttpMethod.GET,
			path: `/projects/${taskadeApi.seg({ value: projectId, label: 'Project ID' })}/members`,
			operation: 'list project members',
			query: { limit, page },
		});
		const rawItems = response.items ?? [];
		const items = rawItems
			.filter((item): item is MemberResponse => item !== null)
			.map((item) => ({ handle: item.handle, displayName: item.displayName ?? null }));
		return taskadeNormalize.pageOutput({ items, fetched: rawItems.length, page, limit });
	},
});
