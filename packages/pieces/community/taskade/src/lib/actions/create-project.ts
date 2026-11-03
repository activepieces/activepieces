import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeAiProps } from '../common/ai-props';
import { taskadeApi } from '../common/client';
import { taskadeNormalize } from '../common/normalize';
import { ItemAPIResponse, ProjectResponse } from '../common/types';
import { taskadeOutputSchemas } from '../output-schemas';

export const createProjectAction = createAction({
	auth: taskadeAuth,
	name: 'create_project',
	displayName: 'Create Project',
	description: 'Creates a project in a workspace or folder, optionally with tasks written as a Markdown list.',
	classification: 'WRITE',
	audience: 'both',
	aiMetadata: {
		description:
			'Creates a new Taskade project in a workspace or folder (a workspace ID uses its home folder) with the given title, and optional Markdown content where each "- item" line becomes a task. Returns the new project ID and link. Not idempotent: each call creates another project.',
		idempotent: false,
	},
	props: {
		folderId: taskadeAiProps.folderId(),
		title: Property.ShortText({
			displayName: 'Project Title',
			required: true,
		}),
		content: Property.LongText({
			displayName: 'Content (Markdown)',
			description: 'Optional. Each line starting with "- " becomes a task; indent with two spaces for subtasks.',
			required: false,
		}),
	},
	outputSchema: taskadeOutputSchemas['project'],
	async run(context) {
		const { folderId, title, content } = context.propsValue;
		const projectTitle = taskadeApi.requireText({ value: title, label: 'Project Title' });
		if (/[\r\n]/.test(projectTitle)) {
			throw new Error('Project Title must be a single line.');
		}
		const body = (content ?? '').trim();
		const markdown = body.length > 0 ? `# ${projectTitle}\n\n${body}` : `# ${projectTitle}`;
		const response = await taskadeApi.request<ItemAPIResponse<ProjectResponse>>({
			token: context.auth.secret_text,
			method: HttpMethod.POST,
			path: '/projects',
			operation: 'create project',
			body: {
				folderId: taskadeApi.requireText({ value: folderId, label: 'Workspace or Folder ID' }),
				contentType: 'text/markdown',
				content: markdown,
			},
		});
		const project = taskadeNormalize.project(response.item);
		return { ...project, name: project.name ?? projectTitle };
	},
});
