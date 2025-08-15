import { QueryClient, useQuery, useMutation } from '@tanstack/react-query';

import { authenticationSession } from '@/lib/authentication-session';
import { PopulatedTodo, Todo } from '@activepieces/shared';

import { todosApi } from './todos-api';

const todoKeys = {
  single: (id: string) => ['todo', id],
  list: (projectId: string, searchParams: URLSearchParams) => [
    'todos',
    projectId,
    searchParams.toString(),
  ],
};
export const todosHooks = {
  useTodo: (todoId: string | null) => {
    return useQuery({
      queryKey: todoKeys.single(todoId!),
      queryFn: () => todosApi.get(todoId!),
      enabled: !!todoId,
    });
  },
  setTodoManually: (
    todoId: string,
    todo: PopulatedTodo,
    queryClient: QueryClient,
  ) => {
    queryClient.setQueryData(todoKeys.single(todoId), todo);
  },

  useDeleteTodos: (refetch: () => void) => {
    return useMutation({
      mutationFn: async (todoIds: string[]) => {
        await Promise.all(todoIds.map((id) => todosApi.delete(id)));
      },
      onSuccess: () => {
        refetch();
      },
    });
  },
  useUpdateStatus: () => {
    return useMutation({
      mutationFn: async ({
        todoId,
        status,
      }: {
        todoId: string;
        status: Todo['status'];
      }) => {
        return todosApi.update(todoId, { status });
      },
    });
  },

  useTodosList: () => {
    const projectId = authenticationSession.getProjectId()!;
    const platformId = authenticationSession.getPlatformId()!;

    return useQuery({
      queryKey: todoKeys.list(projectId, new URLSearchParams()),
      queryFn: () => {
        return todosApi.list({
          projectId,
          limit: 100,
          platformId,
        });
      },
    });
  },
};
