import { QueryClient, useQuery } from '@tanstack/react-query';
import { useLocation, useSearchParams } from 'react-router-dom';

import { authenticationSession } from '@/lib/authentication-session';
import { PopulatedTodo, UNRESOLVED_STATUS } from '@activepieces/shared';

import { todosApi } from './todos-api';

const todoKeys = {
  single: (id: string) => ['todo', id],
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

  useTodosList: (
    activeTab: 'all' | 'needs-action' = 'all',
    flowId?: string,
  ) => {
    const location = useLocation();
    const projectId = authenticationSession.getProjectId()!;
    const platformId = authenticationSession.getPlatformId()!;
    const [searchParams] = useSearchParams();

    return useQuery({
      queryKey: ['todos', location, projectId, activeTab, flowId],
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
          flowId,
          statusOptions,
          title,
        });
      },
    });
  },
};
