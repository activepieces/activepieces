import {
	HttpMessageBody,
	HttpMethod,
	QueryParams,
	httpClient,
	HttpRequest,
	AuthenticationType,
} from '@activepieces/pieces-common';
import {
	CreateTaskDateParams,
	CreateTaskParams,
	ListAPIResponse,
	ProjectResponse,
	CreateTaskResponse,
	WorkspaceFolderResponse,
	WorkspaceResponse,
	TaskResponse,
} from './types';

type RequestParams = Record<string, string | number | string[] | undefined>;

export class TaskadeAPIClient {
	constructor(private personalToken: string) {}

	async makeRequest<T extends HttpMessageBody>(
		method: HttpMethod,
		resourceUri: string,
		query?: RequestParams,
		body: any | undefined = undefined,
	): Promise<T> {
		const baseUrl = 'https://www.taskade.com/api/v1';
		const qs: QueryParams = {};

		if (query) {
			for (const [key, value] of Object.entries(query)) {
				if (value !== null && value !== undefined) {
					qs[key] = String(value);
				}
			}
		}

		const request: HttpRequest = {
			method,
			url: baseUrl + resourceUri,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: this.personalToken,
			},
			queryParams: qs,
			body,
		};

		const response = await httpClient.sendRequest<T>(request);
		return response.body;
	}

	async listWorkspaces(): Promise<ListAPIResponse<WorkspaceResponse>> {
		return await this.makeRequest(HttpMethod.GET, '/workspaces');
	}

	async listWorkspaceFolders(
		workspace_id: string,
	): Promise<ListAPIResponse<WorkspaceFolderResponse>> {
		return await this.makeRequest(HttpMethod.GET, `/workspaces/${workspace_id}/folders`);
	}

	async listProjects(folder_id: string): Promise<ListAPIResponse<ProjectResponse>> {
		return await this.makeRequest(HttpMethod.GET, `/folders/${folder_id}/projects`);
	}

	async createTask(projectId: string, params: CreateTaskParams): Promise<CreateTaskResponse> {
		return await this.makeRequest(HttpMethod.POST, `/projects/${projectId}/tasks`, undefined, {
			tasks: [params],
		});
	}

	async createTaskDate(projectId: string, taskId: string, params: CreateTaskDateParams) {
		return await this.makeRequest(
			HttpMethod.PUT,
			`/projects/${projectId}/tasks/${taskId}/date`,
			undefined,
			params,
		);
	}

	async listTasks(
		projectId: string,
		params: RequestParams,
	): Promise<ListAPIResponse<TaskResponse>> {
		return await this.makeRequest(HttpMethod.GET, `/projects/${projectId}/tasks`, params);
	}

	async completeTask(projectId: string, taskId: string) {
		return await this.makeRequest(
			HttpMethod.POST,
			`/projects/${projectId}/tasks/${taskId}/complete`,
			undefined,
			{},
		);
	}

	async deleteTask(projectId: string, taskId: string) {
		return await this.makeRequest(HttpMethod.DELETE, `/projects/${projectId}/tasks/${taskId}`);
	}
}
