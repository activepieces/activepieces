import { DropdownOption, DropdownState, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { taskadeAuth } from '../auth';
import { taskadeApi } from './client';
import { ListAPIResponse, ProjectResponse, TaskPageResponse, WorkspaceFolderResponse, WorkspaceResponse } from './types';

export const taskadeProps = {
	workspace_id: Property.Dropdown({
		auth: taskadeAuth,
		displayName: 'Workspace',
		refreshers: [],
		required: true,
		options: async ({ auth }) => {
			if (!auth) {
				return emptyOptions('Please connect account first.');
			}
			return dropdownOrError(async () => {
				const response = await listWorkspaces(auth.secret_text);
				return response.items.map((workspace) => ({ label: workspace.name, value: workspace.id }));
			});
		},
	}),
	folder_id: Property.Dropdown({
		auth: taskadeAuth,
		displayName: 'Folder',
		refreshers: ['workspace_id'],
		required: false,
		options: async ({ auth, workspace_id }) => {
			if (!auth) {
				return emptyOptions('Please connect account first.');
			}
			if (!workspace_id) {
				return emptyOptions('Please select workspace.');
			}
			return dropdownOrError(async () => {
				const response = await taskadeApi.request<ListAPIResponse<WorkspaceFolderResponse>>({
					token: auth.secret_text,
					method: HttpMethod.GET,
					path: `/workspaces/${taskadeApi.seg({ value: workspace_id, label: 'Workspace ID' })}/folders`,
					operation: 'list folders',
				});
				return response.items.map((folder) => ({ label: folder.name, value: folder.id }));
			});
		},
	}),
	project_id: Property.Dropdown({
		auth: taskadeAuth,
		displayName: 'Project',
		refreshers: ['workspace_id', 'folder_id'],
		required: true,
		options: async ({ auth, workspace_id, folder_id }) => {
			if (!auth) {
				return emptyOptions('Please connect account first.');
			}
			if (!workspace_id) {
				return emptyOptions('Please select workspace.');
			}
			const folderId = typeof folder_id === 'string' && folder_id.length > 0 ? folder_id : workspace_id;
			return dropdownOrError(async () => {
				const response = await taskadeApi.request<ListAPIResponse<ProjectResponse>>({
					token: auth.secret_text,
					method: HttpMethod.GET,
					path: `/folders/${taskadeApi.seg({ value: folderId, label: 'Folder ID' })}/projects`,
					operation: 'list projects',
				});
				return response.items.map((project) => ({ label: project.name ?? project.id, value: project.id }));
			});
		},
	}),
	task_id: Property.Dropdown({
		auth: taskadeAuth,
		displayName: 'Task',
		refreshers: ['project_id'],
		required: true,
		options: async ({ auth, project_id }) => {
			if (!auth) {
				return emptyOptions('Please connect account first.');
			}
			if (!project_id) {
				return emptyOptions('Please select project.');
			}
			try {
				const { options, truncated } = await listTaskOptions({ token: auth.secret_text, projectId: String(project_id) });
				return {
					disabled: false,
					options,
					placeholder: truncated
						? `Showing the first ${TASK_DROPDOWN_PAGE_SIZE * TASK_DROPDOWN_MAX_PAGES} tasks. Use the Task ID in a custom expression for others.`
						: undefined,
				};
			} catch (error) {
				return emptyOptions(dropdownErrorMessage(error));
			}
		},
	}),
};

export const taskadeDropdowns = { listWorkspaces, listTaskOptions, dropdownErrorMessage };

async function listWorkspaces(token: string): Promise<ListAPIResponse<WorkspaceResponse>> {
	return taskadeApi.request<ListAPIResponse<WorkspaceResponse>>({
		token,
		method: HttpMethod.GET,
		path: '/workspaces',
		operation: 'list workspaces',
	});
}

async function listTaskOptions({ token, projectId }: { token: string; projectId: string }): Promise<{ options: DropdownOption<string>[]; truncated: boolean }> {
	const pages: DropdownOption<string>[][] = [];
	let after: string | undefined = undefined;
	for (let page = 0; page < TASK_DROPDOWN_MAX_PAGES; page++) {
		const response: TaskPageResponse = await taskadeApi.request<TaskPageResponse>({
			token,
			method: HttpMethod.GET,
			path: `/projects/${taskadeApi.seg({ value: projectId, label: 'Project ID' })}/tasks`,
			operation: 'list tasks',
			query: { limit: TASK_DROPDOWN_PAGE_SIZE, after },
		});
		const items = response.items ?? [];
		pages.push(
			items.map((task) => ({
				label: task.parentId ? task.text || '(empty task)' : `${task.text || 'Project'} (project root)`,
				value: task.id,
			})),
		);
		const nextCursor = response.nextCursor ?? items[items.length - 1]?.id;
		const hasMore = response.hasMore ?? items.length === TASK_DROPDOWN_PAGE_SIZE;
		if (!hasMore || items.length === 0 || !nextCursor) {
			return { options: pages.flat(), truncated: false };
		}
		after = nextCursor;
	}
	return { options: pages.flat(), truncated: true };
}

function emptyOptions(placeholder: string): DropdownState<string> {
	return { disabled: true, options: [], placeholder };
}

async function dropdownOrError(load: () => Promise<DropdownOption<string>[]>): Promise<DropdownState<string>> {
	try {
		return { disabled: false, options: await load() };
	} catch (error) {
		return emptyOptions(dropdownErrorMessage(error));
	}
}

function dropdownErrorMessage(error: unknown): string {
	const status = taskadeApi.statusOf(error);
	if (status === 401 || status === 403) {
		return 'Taskade rejected the personal access token. Reconnect the account.';
	}
	if (status === 429) {
		return 'Taskade rate limit reached (30 requests per minute). Wait a minute and refresh.';
	}
	const message = error instanceof Error ? error.message : String(error);
	return `Could not load options from Taskade: ${message.slice(0, 200)}`;
}

const TASK_DROPDOWN_PAGE_SIZE = 1000;
const TASK_DROPDOWN_MAX_PAGES = 10;
