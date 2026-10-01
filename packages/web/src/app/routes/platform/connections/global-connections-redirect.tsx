import { AppConnectionScope } from '@activepieces/shared';
import { Navigate, useLocation } from 'react-router-dom';

import { PLATFORM_CONNECTIONS_PARAMS } from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';

export function GlobalConnectionsRedirect() {
  const { platform } = platformHooks.useCurrentPlatform();
  const { search, hash } = useLocation();
  const params = new URLSearchParams(search);
  if (platform.plan.globalConnectionsEnabled) {
    params.set(PLATFORM_CONNECTIONS_PARAMS.scope, AppConnectionScope.PLATFORM);
  }
  const query = params.toString();
  return (
    <Navigate
      to={{
        pathname: '/platform/connections',
        search: query ? `?${query}` : '',
        hash,
      }}
      replace
    />
  );
}
