import { QueryClient, usePrefetchQuery, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';

import { platformUserApi } from '@/lib/platform-user-api';
import {
  SeekPage,
  UserWithMetaInformation,
  UserWithMetaInformationAndProject,
} from '@activepieces/shared';
import { authenticationSession } from '@/lib/authentication-session';

export const platformUserHooks = {
  useUsers: () => {
    return useQuery<SeekPage<UserWithMetaInformation>, Error>({
      queryKey: ['users'],
      queryFn: async () => {
        const results = await platformUserApi.list();
        return results;
      },
    });
  },
  useCurrentUser: () => {
    const userId = authenticationSession.getCurrentUserId();
    if(!userId) {
      return {
        data: null,
      };
    }
    return useSuspenseQuery<UserWithMetaInformationAndProject, Error>({
      queryKey: ['currentUser', userId],
      queryFn: async () => {
        const result = await platformUserApi.getCurrentUser();
        return result;
      },
      staleTime: Infinity,
    });
  },
  invalidateCurrentUser: (queryClient: QueryClient) => {
    const userId = authenticationSession.getCurrentUserId();
    queryClient.invalidateQueries({ queryKey: ['currentUser', userId] });
  },
};
