import { AppConnectionScope } from '@activepieces/shared';
import { Navigate, useLocation } from 'react-router-dom';

import { platformHooks } from '@/hooks/platform-hooks';

export const GlobalConnectionsRedirect = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const { search, hash } = useLocation();
  const params = new URLSearchParams(search);
  params.delete('cursor');
  if (platform.plan.globalConnectionsEnabled) {
    params.set('scope', AppConnectionScope.PLATFORM);
  }
  const nextSearch = params.toString();
  return (
    <Navigate
      to={{
        pathname: '/platform/connections',
        search: nextSearch ? `?${nextSearch}` : '',
        hash,
      }}
      replace
    />
  );
};
