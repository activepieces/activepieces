import { AppConnectionScope } from '@activepieces/shared';
import { Navigate, useLocation } from 'react-router-dom';

import { platformHooks } from '@/hooks/platform-hooks';

export const GlobalConnectionsRedirect = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const { hash } = useLocation();
  const search = platform.plan.globalConnectionsEnabled
    ? `?${new URLSearchParams({ scope: AppConnectionScope.PLATFORM })}`
    : '';
  return (
    <Navigate
      to={{ pathname: '/platform/connections', search, hash }}
      replace
    />
  );
};
