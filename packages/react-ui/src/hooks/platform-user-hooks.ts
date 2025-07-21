import { useQuery } from '@tanstack/react-query';

import { platformUserApi } from '@/lib/platform-user-api';
import { SeekPage, UserWithMetaInformation } from '@activepieces/shared';

export const platformUserHooks = {
  useUsers: () => {
    return useQuery<SeekPage<UserWithMetaInformation>, Error>({
      queryKey: ['users'],
      queryFn: async () => {
        const results = await platformUserApi.list({
          limit: 2000,
        });
        return results;
      },
    });
  },
};
