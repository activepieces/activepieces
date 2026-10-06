import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeAiProps } from '../common/ai-props';
import { taskadeApi } from '../common/client';
import { taskadeNormalize } from '../common/normalize';
import { ListAPIResponse, ProjectResponse } from '../common/types';
import { taskadeOutputSchemas } from '../output-schemas';

export const listRecentProjectsAction = createAction({
	auth: taskadeAuth,
	name: 'list_recent_projects',
	displayName: 'List My Recent Projects',
	description: 'Lists projects you have access to across all workspaces, most recently viewed first.',
	classification: 'SEARCH',
	audience: 'both',
	aiMetadata: {
		description:
			'Lists Taskade projects the connected user can access across all workspaces, ordered by when they were last viewed, one page at a time. Use when you do not know which workspace or folder a project is in; pass nextPage to continue. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		sort: Property.StaticDropdown({
			displayName: 'Order',
			required: false,
			defaultValue: 'viewed-desc',
			options: {
				disabled: false,
				options: [
					{ label: 'Most recently viewed first', value: 'viewed-desc' },
					{ label: 'Least recently viewed first', value: 'viewed-asc' },
				],
			},
		}),
		limit: taskadeAiProps.limit({ max: 100, defaultValue: 100 }),
		page: taskadeAiProps.page(),
	},
	outputSchema: taskadeOutputSchemas['listRecentProjects'],
	async run(context) {
		const limit = taskadeApi.validateInteger({ value: context.propsValue.limit, label: 'Limit', min: 1, max: 100 }) ?? 100;
		const page = taskadeApi.validateInteger({ value: context.propsValue.page, label: 'Page', min: 1, max: 100_000 }) ?? 1;
		const sort = context.propsValue.sort === 'viewed-asc' ? 'viewed-asc' : 'viewed-desc';
		const response = await taskadeApi.request<ListAPIResponse<ProjectResponse>>({
			token: context.auth.secret_text,
			method: HttpMethod.GET,
			path: '/me/projects',
			operation: 'list my projects',
			query: { limit, page, sort },
		});
		const items = (response.items ?? []).map((item) => taskadeNormalize.project(item));
		return taskadeNormalize.pageOutput({ items, page, limit });
	},
});
