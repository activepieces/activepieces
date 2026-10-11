import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeAiProps } from '../common/ai-props';
import { taskadeApi } from '../common/client';
import { taskadeNormalize } from '../common/normalize';
import { ItemAPIResponse, ProjectResponse } from '../common/types';
import { taskadeOutputSchemas } from '../output-schemas';

export const createProjectFromTemplateAction = createAction({
	auth: taskadeAuth,
	name: 'create_project_from_template',
	displayName: 'Create Project from Template',
	description: 'Creates a project from one of your Taskade project templates.',
	classification: 'WRITE',
	audience: 'both',
	aiMetadata: {
		description:
			'Creates a new Taskade project in a workspace or folder from a project template (get template IDs from List Project Templates). Returns the new project ID and link. Not idempotent: each call creates another project.',
		idempotent: false,
	},
	props: {
		folderId: taskadeAiProps.folderId({ description: 'Where to create the project. A workspace ID works for its home folder.' }),
		templateId: Property.ShortText({
			displayName: 'Template ID',
			description: 'Get it from List Project Templates.',
			required: true,
		}),
	},
	outputSchema: taskadeOutputSchemas['project'],
	async run(context) {
		const response = await taskadeApi.request<ItemAPIResponse<ProjectResponse>>({
			token: context.auth.secret_text,
			method: HttpMethod.POST,
			path: '/projects/from-template',
			operation: 'create project from template',
			body: {
				folderId: taskadeApi.requireText({ value: context.propsValue.folderId, label: 'Workspace or Folder ID' }),
				templateId: taskadeApi.requireText({ value: context.propsValue.templateId, label: 'Template ID' }),
			},
		});
		return taskadeNormalize.projectWithName({ token: context.auth.secret_text, item: response.item });
	},
});
