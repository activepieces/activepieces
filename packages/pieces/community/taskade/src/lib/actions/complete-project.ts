import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeAiProps } from '../common/ai-props';
import { taskadeApi } from '../common/client';
import { taskadeNormalize } from '../common/normalize';
import { ItemAPIResponse, ProjectResponse } from '../common/types';
import { taskadeOutputSchemas } from '../output-schemas';

export const completeProjectAction = createAction({
	auth: taskadeAuth,
	name: 'complete_project',
	displayName: 'Complete (Archive) Project',
	description: 'Marks a project as completed, which archives it.',
	classification: 'WRITE',
	audience: 'both',
	aiMetadata: {
		description:
			'Marks a whole Taskade project as completed, which archives it; Restore Project undoes it. Repeating it leaves the project completed, so it is idempotent.',
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
			path: `${path}/complete`,
			operation: 'complete project',
			body: {},
		});
		const current = await taskadeApi.request<ItemAPIResponse<ProjectResponse>>({
			token: context.auth.secret_text,
			method: HttpMethod.GET,
			path,
			operation: 'get project',
		});
		return { ...taskadeNormalize.project(current.item), completed: true };
	},
});
