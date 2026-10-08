import { isNil } from '@activepieces/core-utils';
import { QueryMeta, useQuery } from '@tanstack/react-query';

import { platformConfigurationApi } from '@/api/platform-configuration-api';
import { userHooks } from '@/hooks/user-hooks';

const queryKey = ['platform-configuration'];

export const platformConfigurationHooks = {
  queryKey,
  useCurrentPlatformConfiguration: (
    options?: PlatformConfigurationQueryOptions,
  ) => {
    const { data: currentUser } = userHooks.useCurrentUser();
    return useQuery({
      queryKey,
      queryFn: platformConfigurationApi.get,
      enabled: !isNil(currentUser),
      ...options,
    });
  },
};

export type PlatformConfigurationQueryOptions = {
  refetchOnMount?: boolean | 'always';
  meta?: QueryMeta;
};
