import { api } from '@/lib/api';
import {
  CreateTodoRequestBody,
  ListTodosQueryParams,
  Todo,
  PopulatedTodo,
  SeekPage,
  UpdateTodoRequestBody,
} from '@activepieces/shared';

export const todosApi = {
  async get(id: string) {
    return await api.get<PopulatedTodo>(`/v1/todos/${id}`);
  },
  async list(request: ListTodosQueryParams) {
    return await api.get<SeekPage<PopulatedTodo>>(`/v1/todos`, request);
  },
  async update(id: string, requestBody: UpdateTodoRequestBody) {
    return await api.post<Todo>(`/v1/todos/${id}`, requestBody);
  },
};
