import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeApi } from '../common/client';
import { ListAPIResponse, WorkspaceResponse } from '../common/types';
import { taskadeOutputSchemas } from '../output-schemas';

export const listWorkspacesAction = createAction({
	auth: taskadeAuth,
	name: 'list_workspaces',
	displayName: 'List Workspaces',
	description: 'Lists the Taskade workspaces you belong to.',
	classification: 'SEARCH',
	audience: 'both',
	aiMetadata: {
		description:
			'Lists every Taskade workspace the connected user belongs to, with ID and name. Use first to get a workspace ID for List Folders, List Projects, Create Project or List AI Agents (a workspace ID also works as its home folder ID). Read-only and idempotent.',
		idempotent: true,
	},
	props: {},
	outputSchema: taskadeOutputSchemas['listWorkspaces'],
	async run(context) {
		const response = await taskadeApi.request<ListAPIResponse<WorkspaceResponse>>({
			token: context.auth.secret_text,
			method: HttpMethod.GET,
			path: '/workspaces',
			operation: 'list workspaces',
		});
		return { items: (response.items ?? []).filter((item) => item !== null).map((item) => ({ id: item.id, name: item.name })) };
	},
});
