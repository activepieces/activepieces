import { isNil } from '@activepieces/core-utils';
import { useQuery } from '@tanstack/react-query';

import { platformConfigurationApi } from '@/api/platform-configuration-api';
import { userHooks } from '@/hooks/user-hooks';

const queryKey = ['platform-configuration'];

export const platformConfigurationHooks = {
  queryKey,
  useCurrentPlatformConfiguration: () => {
    const { data: currentUser } = userHooks.useCurrentUser();
    return useQuery({
      queryKey,
      queryFn: platformConfigurationApi.get,
      enabled: !isNil(currentUser),
      staleTime: Infinity,
    });
  },
};
