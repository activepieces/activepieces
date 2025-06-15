import { api } from '@/lib/api';
import {
  CreateTodoActivityRequestBody,
  ListTodoActivitiesQueryParams,
  SeekPage,
  TodoActivity,
  TodoActivityWithUser,
} from '@activepieces/shared';

export const todoActivityApi = {
  async list(todoId: string, request: ListTodoActivitiesQueryParams) {
    return await api.get<SeekPage<TodoActivityWithUser>>(
      `/v1/todos/${todoId}/activities`,
      request,
    );
  },
  async create(todoId: string, requestBody: CreateTodoActivityRequestBody) {
    return await api.post<TodoActivity>(
      `/v1/todos/${todoId}/activities`,
      requestBody,
    );
  },
};
