import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeAiProps } from '../common/ai-props';
import { taskadeApi } from '../common/client';
import { taskadeNormalize } from '../common/normalize';
import { ItemAPIResponse, ProjectResponse } from '../common/types';
import { taskadeOutputSchemas } from '../output-schemas';

export const getProjectAction = createAction({
	auth: taskadeAuth,
	name: 'get_project',
	displayName: 'Get Project',
	description: 'Gets a project by ID or link.',
	classification: 'READ',
	audience: 'both',
	aiMetadata: {
		description:
			'Returns one Taskade project (ID, name, icon, archived state and link) from its ID or https://www.taskade.com/d/ link. Use to check a project exists or is archived before working on it. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		projectId: taskadeAiProps.projectId(),
	},
	outputSchema: taskadeOutputSchemas['project'],
	async run(context) {
		const projectId = taskadeApi.parseProjectId(context.propsValue.projectId);
		const response = await taskadeApi.request<ItemAPIResponse<ProjectResponse>>({
			token: context.auth.secret_text,
			method: HttpMethod.GET,
			path: `/projects/${taskadeApi.seg({ value: projectId, label: 'Project ID' })}`,
			operation: 'get project',
		});
		return taskadeNormalize.project(response.item);
	},
});
