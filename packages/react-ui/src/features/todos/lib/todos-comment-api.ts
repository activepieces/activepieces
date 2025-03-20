import { api } from '@/lib/api';
import {
  CreateTodoCommentRequestBody,
  TodoComment,
  ListTodoCommentsQueryParams,
  TodoCommentWithUser,
} from '@activepieces/ee-shared';
import { SeekPage } from '@activepieces/shared';

export const todoCommentApi = {
  async list(todoId: string, request: ListTodoCommentsQueryParams) {
    return await api.get<SeekPage<TodoCommentWithUser>>(
      `/v1/todos/${todoId}/comments`,
      request,
    );
  },
  async create(todoId: string, requestBody: CreateTodoCommentRequestBody) {
    return await api.post<TodoComment>(
      `/v1/todos/${todoId}/comments`,
      requestBody,
    );
  },
};
