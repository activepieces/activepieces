import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeAiProps } from '../common/ai-props';
import { taskadeApi } from '../common/client';
import { taskadeNormalize } from '../common/normalize';
import { ListAPIResponse, ProjectResponse } from '../common/types';
import { taskadeOutputSchemas } from '../output-schemas';

export const listProjectsAction = createAction({
	auth: taskadeAuth,
	name: 'list_projects',
	displayName: 'List Projects',
	description: 'Lists the projects in a workspace or folder, optionally filtered by name.',
	classification: 'SEARCH',
	audience: 'both',
	aiMetadata: {
		description:
			'Lists all projects in one Taskade workspace or folder (a workspace ID lists its home folder), with ID, name, archived state and link. Optionally keeps only names containing some text (case-insensitive) and can hide archived projects. Use to find a project ID by name. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		folderId: taskadeAiProps.folderId(),
		nameContains: Property.ShortText({
			displayName: 'Name Contains',
			description: 'Only return projects whose name contains this text (case-insensitive).',
			required: false,
		}),
		includeCompleted: Property.Checkbox({
			displayName: 'Include Archived Projects',
			description: 'Include completed (archived) projects.',
			required: false,
			defaultValue: true,
		}),
	},
	outputSchema: taskadeOutputSchemas['listProjects'],
	async run(context) {
		const { folderId, nameContains, includeCompleted } = context.propsValue;
		const response = await taskadeApi.request<ListAPIResponse<ProjectResponse | null>>({
			token: context.auth.secret_text,
			method: HttpMethod.GET,
			path: `/folders/${taskadeApi.seg({ value: folderId, label: 'Folder ID' })}/projects`,
			operation: 'list projects',
		});
		const needle = (nameContains ?? '').trim().toLowerCase();
		const items = (response.items ?? [])
			.filter((item): item is ProjectResponse => item !== null)
			.map((item) => taskadeNormalize.project(item))
			.filter((project) => includeCompleted !== false || !project.completed)
			.filter((project) => needle.length === 0 || (project.name ?? '').toLowerCase().includes(needle));
		return { items };
	},
});
