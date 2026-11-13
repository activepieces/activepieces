import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeAiProps } from '../common/ai-props';
import { taskadeApi } from '../common/client';
import { taskadeNormalize } from '../common/normalize';
import { ItemAPIResponse, ProjectResponse } from '../common/types';
import { taskadeOutputSchemas } from '../output-schemas';

export const copyProjectAction = createAction({
	auth: taskadeAuth,
	name: 'copy_project',
	displayName: 'Copy Project',
	description: 'Copies a project, with its tasks, into a workspace or folder.',
	classification: 'WRITE',
	audience: 'both',
	aiMetadata: {
		description:
			'Duplicates a Taskade project with all its tasks into a workspace or folder, optionally with a new title. Returns the copy\'s project ID and link. Not idempotent: each call makes another copy.',
		idempotent: false,
	},
	props: {
		projectId: taskadeAiProps.projectId({ displayName: 'Project to Copy' }),
		folderId: taskadeAiProps.folderId({ description: 'Where to put the copy. A workspace ID works for its home folder.' }),
		projectTitle: Property.ShortText({
			displayName: 'New Title',
			description: 'Optional title for the copy. Leave empty to keep the original title.',
			required: false,
		}),
	},
	outputSchema: taskadeOutputSchemas['project'],
	async run(context) {
		const { projectId, folderId, projectTitle } = context.propsValue;
		const sourceId = taskadeApi.parseProjectId(projectId);
		const title = (projectTitle ?? '').trim();
		const response = await taskadeApi.request<ItemAPIResponse<ProjectResponse>>({
			token: context.auth.secret_text,
			method: HttpMethod.POST,
			path: `/projects/${taskadeApi.seg({ value: sourceId, label: 'Project ID' })}/copy`,
			operation: 'copy project',
			body: {
				folderId: taskadeApi.requireText({ value: folderId, label: 'Workspace or Folder ID' }),
				...(title.length > 0 ? { projectTitle: title } : {}),
			},
		});
		return taskadeNormalize.projectWithName({ token: context.auth.secret_text, item: response.item });
	},
});
