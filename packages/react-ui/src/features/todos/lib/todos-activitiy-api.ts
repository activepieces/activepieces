import { api } from '@/lib/api';
import {
  CreateTodoActivityRequestBody,
  ListTodoActivitiesQueryParams,
  SeekPage,
  TodoActivity,
  TodoActivityWithUser,
} from '@activepieces/shared';

export const todoActivityApi = {
  async list(request: ListTodoActivitiesQueryParams) {
    return await api.get<SeekPage<TodoActivityWithUser>>(
      `/v1/todo-activities`,
      request,
    );
  },
  async create(requestBody: CreateTodoActivityRequestBody) {
    return await api.post<TodoActivity>(`/v1/todo-activities`, requestBody);
  },
};
