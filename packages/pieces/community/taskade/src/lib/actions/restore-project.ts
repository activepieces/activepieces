import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeAiProps } from '../common/ai-props';
import { taskadeApi } from '../common/client';
import { taskadeNormalize } from '../common/normalize';
import { ItemAPIResponse, ProjectResponse } from '../common/types';
import { taskadeOutputSchemas } from '../output-schemas';

export const restoreProjectAction = createAction({
	auth: taskadeAuth,
	name: 'restore_project',
	displayName: 'Restore Project',
	description: 'Restores a completed (archived) project.',
	classification: 'WRITE',
	audience: 'both',
	aiMetadata: {
		description:
			'Restores a completed (archived) Taskade project so it is active again; the opposite of Complete (Archive) Project. Repeating it leaves the project active, so it is idempotent.',
		idempotent: true,
	},
	props: {
		projectId: taskadeAiProps.projectId(),
	},
	outputSchema: taskadeOutputSchemas['project'],
	async run(context) {
		const projectId = taskadeApi.parseProjectId(context.propsValue.projectId);
		const path = `/projects/${taskadeApi.seg({ value: projectId, label: 'Project ID' })}`;
		await taskadeApi.request({
			token: context.auth.secret_text,
			method: HttpMethod.POST,
			path: `${path}/restore`,
			operation: 'restore project',
			body: {},
		});
		const current = await taskadeApi.request<ItemAPIResponse<ProjectResponse>>({
			token: context.auth.secret_text,
			method: HttpMethod.GET,
			path,
			operation: 'get project',
		});
		return { ...taskadeNormalize.project(current.item), completed: false };
	},
});
