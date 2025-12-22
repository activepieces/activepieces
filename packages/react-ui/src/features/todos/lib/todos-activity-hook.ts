import { useQuery } from '@tanstack/react-query';

import { authenticationSession } from '@/lib/authentication-session';

import { todoActivityApi } from './todos-activitiy-api';

export const todoActivitiesHook = {
  useComments: (todoId: string | null) => {
    return useQuery({
      queryKey: ['todos', todoId, 'comments'],
      queryFn: () =>
        todoActivityApi.list({
          projectId: authenticationSession.getProjectId()!,
          todoId: todoId!,
          cursor: undefined,
          limit: 100,
          type: undefined,
        }),
      enabled: !!todoId,
    });
  },
};
