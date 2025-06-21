import { useQuery } from '@tanstack/react-query';

import { todoActivityApi } from './todos-activitiy-api';

export const todoActivitiesHook = {
  useComments: (todoId: string) => {
    return useQuery({
      queryKey: ['todos', todoId, 'comments'],
      queryFn: () =>
        todoActivityApi.list(todoId, {
          cursor: undefined,
          limit: 100,
          type: undefined,
        }),
    });
  },
};
