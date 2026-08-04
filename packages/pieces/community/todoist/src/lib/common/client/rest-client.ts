import {
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { isNotUndefined, pickBy } from '@activepieces/pieces-framework';
import {
  TodoistCompletedTask,
  TodoistCreateTaskRequest,
  TodoistProject,
  TodoistSection,
  TodoistTask,
  TodoistUpdateTaskRequest,
} from '../models';

const API = 'https://api.todoist.com/api/v1';

type PaginatedResponse<T> = {
  results: T[];
  next_cursor: string | null;
};

async function fetchAllPages<T>(
  token: string,
  url: string,
  baseParams: Record<string, string | undefined> = {},
): Promise<T[]> {
  const items: T[] = [];
  let cursor: string | null = null;

  do {
    const queryParams = pickBy(
      { ...baseParams, cursor: cursor ?? undefined },
      isNotUndefined,
    );

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token },
      queryParams,
    };

    const response = await httpClient.sendRequest<PaginatedResponse<T>>(request);
    items.push(...response.body.results);
    cursor = response.body.next_cursor;
  } while (cursor);

  return items;
}

export const todoistRestClient = {
  projects: {
    async list({ token }: ProjectsListParams): Promise<TodoistProject[]> {
      return fetchAllPages<TodoistProject>(token, `${API}/projects`);
    },
  },

  sections: {
    async list({ token, project_id }: SectionsListParams): Promise<TodoistSection[]> {
      return fetchAllPages<TodoistSection>(token, `${API}/sections`, { project_id });
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
      const body: TodoistCreateTaskRequest = {
        content,
        project_id,
        description,
        labels,
        priority,
        section_id,
        ...dueDateParams(due_date),
      };

      const request: HttpRequest<TodoistCreateTaskRequest> = {
        method: HttpMethod.POST,
        url: `${API}/tasks`,
        authentication: { type: AuthenticationType.BEARER_TOKEN, token },
        body,
      };

      const response = await httpClient.sendRequest<TodoistTask>(request);
      return response.body;
    },

    async update(params: TasksUpdateParams): Promise<TodoistTask> {
      const body: TodoistUpdateTaskRequest = {
        content: params.content,
        description: params.description,
        labels: params.labels?.length === 0 ? undefined : params.labels,
        priority: params.priority,
        ...dueDateParams(params.due_date),
      };

      const request: HttpRequest<TodoistUpdateTaskRequest> = {
        method: HttpMethod.POST,
        url: `${API}/tasks/${params.task_id}`,
        authentication: { type: AuthenticationType.BEARER_TOKEN, token: params.token },
        body,
      };

      const response = await httpClient.sendRequest<TodoistTask>(request);
      return response.body;
    },

    async list({ token, project_id, filter }: TasksListParams): Promise<TodoistTask[]> {
      return fetchAllPages<TodoistTask>(token, `${API}/tasks`, { project_id, filter });
    },

    async close({ token, task_id }: { token: string; task_id: string }) {
      const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `${API}/tasks/${task_id}/close`,
        authentication: { type: AuthenticationType.BEARER_TOKEN, token },
      };

      const response = await httpClient.sendRequest(request);
      return response.body;
    },

    async listCompleted({ token, since, until, project_id }: CompletedListParams): Promise<TodoistCompletedTask[]> {
      const tasks: TodoistCompletedTask[] = [];
      let cursor: string | null = null;

      do {
        const queryParams = pickBy(
          { since, until, project_id, limit: '200', cursor: cursor ?? undefined },
          isNotUndefined,
        );

        const request: HttpRequest = {
          method: HttpMethod.GET,
          url: `${API}/tasks/completed`,
          authentication: { type: AuthenticationType.BEARER_TOKEN, token },
          queryParams,
        };

        const response = await httpClient.sendRequest<{ items: TodoistCompletedTask[]; next_cursor: string | null }>(request);
        tasks.push(...response.body.items);
        cursor = response.body.next_cursor;
      } while (cursor);

      return tasks;
    },

    async get({ token, task_id }: { token: string; task_id: string }): Promise<TodoistTask> {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${API}/tasks/${task_id}`,
        authentication: { type: AuthenticationType.BEARER_TOKEN, token },
      };

      const response = await httpClient.sendRequest<TodoistTask>(request);
      return response.body;
    },

    async filter({ token, query, lang, limit }: TasksFilterParams): Promise<TodoistTask[]> {
      const tasks: TodoistTask[] = [];
      let cursor: string | null = null;

      do {
        const queryParams = pickBy(
          {
            query,
            lang,
            limit: limit !== undefined ? String(limit) : undefined,
            cursor: cursor ?? undefined,
          },
          isNotUndefined,
        );

        const request: HttpRequest = {
          method: HttpMethod.GET,
          url: `${API}/tasks/filter`,
          authentication: { type: AuthenticationType.BEARER_TOKEN, token },
          queryParams,
        };

        const response = await httpClient.sendRequest<PaginatedResponse<TodoistTask>>(request);
        tasks.push(...response.body.results);
        cursor = response.body.next_cursor;
      } while (cursor);

      return tasks;
    },

    async delete({ token, task_id }: { token: string; task_id: string }) {
      const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: `${API}/tasks/${task_id}`,
        authentication: { type: AuthenticationType.BEARER_TOKEN, token },
      };

      const response = await httpClient.sendRequest(request);
      return response.body;
    },

    async reopen({ token, task_id }: { token: string; task_id: string }) {
      const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `${API}/tasks/${task_id}/reopen`,
        authentication: { type: AuthenticationType.BEARER_TOKEN, token },
      };

      const response = await httpClient.sendRequest(request);
      return response.body;
    },

    async move({ token, task_id, project_id, section_id, parent_id }: TasksMoveParams): Promise<TodoistTask> {
      const body = pickBy({ project_id, section_id, parent_id }, isNotUndefined);

      const request: HttpRequest<Record<string, string>> = {
        method: HttpMethod.POST,
        url: `${API}/tasks/${task_id}/move`,
        authentication: { type: AuthenticationType.BEARER_TOKEN, token },
        body,
      };

      const response = await httpClient.sendRequest<TodoistTask>(request);
      return response.body;
    },

    async quickAdd({ token, text, note, reminder, auto_reminder }: TasksQuickAddParams): Promise<TodoistTask> {
      const body = pickBy({ text, note, reminder, auto_reminder }, isNotUndefined);

      const request: HttpRequest<Record<string, unknown>> = {
        method: HttpMethod.POST,
        url: `${API}/tasks/quick`,
        authentication: { type: AuthenticationType.BEARER_TOKEN, token },
        body,
      };

      const response = await httpClient.sendRequest<TodoistTask>(request);
      return response.body;
    },

    async listCompletedByCompletionDate(params: CompletedByDateParams): Promise<TodoistCompletedTask[]> {
      return fetchCompletedByDate(`${API}/tasks/completed/by_completion_date`, params);
    },

    async listCompletedByDueDate(params: CompletedByDateParams): Promise<TodoistCompletedTask[]> {
      return fetchCompletedByDate(`${API}/tasks/completed/by_due_date`, params);
    },
  },
};

async function fetchCompletedByDate(
  url: string,
  { token, since, until, project_id, section_id, parent_id, filter_query, limit }: CompletedByDateParams,
): Promise<TodoistCompletedTask[]> {
  const tasks: TodoistCompletedTask[] = [];
  let cursor: string | null = null;

  do {
    const queryParams = pickBy(
      {
        since,
        until,
        project_id,
        section_id,
        parent_id,
        filter_query,
        limit: limit !== undefined ? String(limit) : '200',
        cursor: cursor ?? undefined,
      },
      isNotUndefined,
    );

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token },
      queryParams,
    };

    const response = await httpClient.sendRequest<{ items: TodoistCompletedTask[]; next_cursor: string | null }>(request);
    tasks.push(...response.body.items);
    cursor = response.body.next_cursor;
  } while (cursor);

  return tasks;
}

type ProjectsListParams = {
  token: string;
};

type SectionsListParams = {
  token: string;
  project_id?: string;
};

type TasksCreateParams = {
  token: string;
} & TodoistCreateTaskRequest;

type TasksUpdateParams = {
  token: string;
  task_id: string;
} & TodoistUpdateTaskRequest;

type TasksListParams = {
  token: string;
  project_id?: string | undefined;
  filter?: string | undefined;
};

type CompletedListParams = {
  token: string;
  since: string;
  until: string;
  project_id?: string | undefined;
};

type TasksFilterParams = {
  token: string;
  query: string;
  lang?: string | undefined;
  limit?: number | undefined;
};

type TasksMoveParams = {
  token: string;
  task_id: string;
  project_id?: string | undefined;
  section_id?: string | undefined;
  parent_id?: string | undefined;
};

type TasksQuickAddParams = {
  token: string;
  text: string;
  note?: string | undefined;
  reminder?: string | undefined;
  auto_reminder?: boolean | undefined;
};

type CompletedByDateParams = {
  token: string;
  since: string;
  until: string;
  project_id?: string | undefined;
  section_id?: string | undefined;
  parent_id?: string | undefined;
  filter_query?: string | undefined;
  limit?: number | undefined;
};

const dueDateParams = (dueDate?: string) => {
  if (dueDate) {
    const parsedDate = Date.parse(dueDate);
    if (isNaN(parsedDate)) {
      return { due_string: dueDate };
    } else if (/\d{4}-\d{2}-\d{2}/.test(dueDate)) {
      return { due_date: dueDate };
    } else {
      return { due_datetime: new Date(parsedDate).toISOString() };
    }
  }
  return {};
};
