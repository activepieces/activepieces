import { useQuery } from '@tanstack/react-query';

import { platformUserApi } from '@/lib/platform-user-api';
import { SeekPage, User } from '@activepieces/shared';

export const platformUserHooks = {
  useUsers: () => {
    return useQuery<SeekPage<User>, Error>({
      queryKey: ['users'],
      queryFn: async () => {
        const results = await platformUserApi.list();
        return results;
      },
    });
  },
};
