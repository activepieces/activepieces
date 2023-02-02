import { AuthenticationType } from "../../../common/authentication/core/authentication-type";
import { httpClient } from "../../../common/http/core/http-client";
import { HttpMethod } from "../../../common/http/core/http-method";
import { HttpRequest } from "../../../common/http/core/http-request";
import { TodoistCreateTaskRequest, TodoistProject, TodoistTask } from "./models";

const API = 'https://api.todoist.com/rest/v2';

export const todoistClient = {
  projects: {
    async list({ token }: ProjectsListParams): Promise<TodoistProject[]> {
      const request: HttpRequest<never> = {
        method: HttpMethod.GET,
        url: `${API}/projects`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token,
        },
      };

      const response = await httpClient.sendRequest<TodoistProject[]>(request);
      return response.body;
    }
  },

  tasks: {
    async create({ token, projectId, content }: TasksCreateParams): Promise<TodoistTask> {
      const request: HttpRequest<TodoistCreateTaskRequest> = {
        method: HttpMethod.POST,
        url: `${API}/tasks`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token,
        },
        body: {
          content,
          project_id: projectId,
        },
      };

      const response = await httpClient.sendRequest<TodoistTask>(request);
      return response.body;
    }
  }
};

type ProjectsListParams = {
  token: string;
}

type TasksCreateParams = {
  token: string;
  content: string;
  projectId?: string | undefined;
}
