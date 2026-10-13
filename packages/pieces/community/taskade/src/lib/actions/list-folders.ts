import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeApi } from '../common/client';
import { ListAPIResponse, WorkspaceFolderResponse } from '../common/types';
import { taskadeOutputSchemas } from '../output-schemas';

export const listFoldersAction = createAction({
	auth: taskadeAuth,
	name: 'list_folders',
	displayName: 'List Folders',
	description: 'Lists the folders of a workspace, including its home folder.',
	classification: 'SEARCH',
	audience: 'both',
	aiMetadata: {
		description:
			'Lists the folders of one Taskade workspace, with ID and name. The list includes the workspace home folder, whose ID equals the workspace ID. Use to pick a folder ID for List Projects, Create Project or List AI Agents. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		workspaceId: Property.ShortText({
			displayName: 'Workspace ID',
			description: 'Get it from List Workspaces.',
			required: true,
		}),
	},
	outputSchema: taskadeOutputSchemas['listFolders'],
	async run(context) {
		const response = await taskadeApi.request<ListAPIResponse<WorkspaceFolderResponse>>({
			token: context.auth.secret_text,
			method: HttpMethod.GET,
			path: `/workspaces/${taskadeApi.seg({ value: context.propsValue.workspaceId, label: 'Workspace ID' })}/folders`,
			operation: 'list folders',
		});
		return { items: (response.items ?? []).filter((item) => item !== null).map((item) => ({ id: item.id, name: item.name })) };
	},
});
