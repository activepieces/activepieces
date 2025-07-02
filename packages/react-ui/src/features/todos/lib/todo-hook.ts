import { QueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';

import { authenticationSession } from '@/lib/authentication-session';
import { PopulatedTodo, UNRESOLVED_STATUS } from '@activepieces/shared';

import { todosApi } from './todos-api';

const todoKeys = {
  single: (id: string) => ['todo', id],
  list: (
    projectId: string,
    activeTab: string,
    searchParams: URLSearchParams,
  ) => ['todos', projectId, activeTab, searchParams.toString()],
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

  useTodosList: (activeTab: 'all' | 'needs-action' = 'all') => {
    const projectId = authenticationSession.getProjectId()!;
    const platformId = authenticationSession.getPlatformId()!;
    const [searchParams] = useSearchParams();

    return useQuery({
      queryKey: todoKeys.list(projectId, activeTab, searchParams),
      queryFn: () => {
        const cursor = searchParams.get('cursor');
        const limit = searchParams.get('limit')
          ? parseInt(searchParams.get('limit')!)
          : 10;
        const assigneeId = searchParams.get('assigneeId') ?? undefined;
        const title = searchParams.get('title') ?? undefined;
        const statusOptions =
          activeTab === 'needs-action' ? [UNRESOLVED_STATUS.name] : undefined;

        return todosApi.list({
          projectId,
          cursor: cursor ?? undefined,
          limit,
          platformId,
          assigneeId,
          statusOptions,
          title,
        });
      },
    });
  },
};
