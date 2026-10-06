import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeAiProps } from '../common/ai-props';
import { taskadeApi } from '../common/client';
import { taskadeNormalize } from '../common/normalize';
import { BaseResponse, ListAPIResponse } from '../common/types';
import { taskadeOutputSchemas } from '../output-schemas';

export const listProjectTemplatesAction = createAction({
	auth: taskadeAuth,
	name: 'list_project_templates',
	displayName: 'List Project Templates',
	description: 'Lists the project templates saved in a workspace or folder.',
	classification: 'SEARCH',
	audience: 'both',
	aiMetadata: {
		description:
			'Lists the project templates saved in one Taskade workspace or folder, with ID and name, one page at a time. Use to get a template ID for Create Project from Template; pass nextPage to continue. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		folderId: taskadeAiProps.folderId(),
		limit: taskadeAiProps.limit({ max: 100, defaultValue: 20 }),
		page: taskadeAiProps.page(),
	},
	outputSchema: taskadeOutputSchemas['listProjectTemplates'],
	async run(context) {
		const limit = taskadeApi.validateInteger({ value: context.propsValue.limit, label: 'Limit', min: 1, max: 100 }) ?? 20;
		const page = taskadeApi.validateInteger({ value: context.propsValue.page, label: 'Page', min: 1, max: 100_000 }) ?? 1;
		const response = await taskadeApi.request<ListAPIResponse<Partial<BaseResponse> | null>>({
			token: context.auth.secret_text,
			method: HttpMethod.GET,
			path: `/folders/${taskadeApi.seg({ value: context.propsValue.folderId, label: 'Folder ID' })}/project-templates`,
			operation: 'list project templates',
			query: { limit, page },
		});
		const items = (response.items ?? [])
			.filter((item): item is Partial<BaseResponse> => item !== null && typeof item.id === 'string')
			.map((item) => ({ id: item.id ?? '', name: item.name ?? null }));
		return taskadeNormalize.pageOutput({ items, page, limit });
	},
});
