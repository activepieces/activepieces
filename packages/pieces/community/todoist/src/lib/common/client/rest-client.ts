import {
	HttpRequest,
	HttpMethod,
	AuthenticationType,
	httpClient,
} from '@activepieces/pieces-common';
import { isNotUndefined, pickBy } from '@activepieces/shared';
import {
	TodoistCreateTaskRequest,
	TodoistProject,
	TodoistSection,
	TodoistTask,
	TodoistUpdateTaskRequest,
} from '../models';

const API = 'https://api.todoist.com/rest/v2';

export const todoistRestClient = {
	projects: {
		async list({ token }: ProjectsListParams): Promise<TodoistProject[]> {
			const request: HttpRequest = {
				method: HttpMethod.GET,
				url: `${API}/projects`,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token,
				},
			};

			const response = await httpClient.sendRequest<TodoistProject[]>(request);
			return response.body;
		},
	},

	sections: {
		async list(params: SectionsListPrams): Promise<TodoistSection[]> {
			const qs: Record<string, any> = {};
			if (params.project_id) qs['project_id'] = params.project_id;

			const request: HttpRequest = {
				method: HttpMethod.GET,
				url: `${API}/sections`,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: params.token,
				},
				queryParams: qs,
			};

			const response = await httpClient.sendRequest<TodoistSection[]>(request);
			return response.body;
		},
	},

	tasks: {
		async create({
			token,
			project_id,
			content,
			description,
			labels,
			priority,
			due_date,
			section_id,
		}: TasksCreateParams): Promise<TodoistTask> {
			const request: HttpRequest<TodoistCreateTaskRequest> = {
				method: HttpMethod.POST,
				url: `${API}/tasks`,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token,
				},
				body: {
					content,
					project_id,
					description,
					labels,
					priority,
					due_date,
					section_id,
				},
			};

			const response = await httpClient.sendRequest<TodoistTask>(request);
			return response.body;
		},

		async update(params: TasksUpdateParams): Promise<TodoistTask> {
			const request: HttpRequest = {
				method: HttpMethod.POST,
				url: `${API}/tasks/${params.task_id}`,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: params.token,
				},
				body: {
					content: params.content,
					description: params.description,
					labels: params.labels?.length === 0 ? undefined : params.labels,
					priority: params.priority,
					due_date: params.due_date,
				},
			};

			const response = await httpClient.sendRequest<TodoistTask>(request);
			return response.body;
		},

		async list({ token, project_id, filter }: TasksListParams): Promise<TodoistTask[]> {
			const queryParams = {
				filter,
				project_id,
			};

			const request: HttpRequest = {
				method: HttpMethod.GET,
				url: `${API}/tasks`,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token,
				},
				queryParams: pickBy(queryParams, isNotUndefined),
			};

			const response = await httpClient.sendRequest<TodoistTask[]>(request);
			return response.body;
		},

		async close({ token, task_id }: { token: string; task_id: string }) {
			const request: HttpRequest = {
				method: HttpMethod.POST,
				url: `${API}/tasks/${task_id}/close`,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token,
				},
			};

			const response = await httpClient.sendRequest(request);
			return response.body;
		},
	},
};

type ProjectsListParams = {
	token: string;
};

type SectionsListPrams = {
	token: string;
	project_id?: string;
};

type TasksCreateParams = {
	token: string;
} & TodoistCreateTaskRequest;

type TasksUpdateParams = {
	token: string;
} & TodoistUpdateTaskRequest;

type TasksListParams = {
	token: string;
	project_id?: string | undefined;
	filter?: string | undefined;
};
