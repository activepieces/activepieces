import { AppConnectionScope } from '@activepieces/shared';
import { Navigate, useLocation } from 'react-router-dom';

import { PlanFeatureGuard } from '../plan-feature-sample';

export const GlobalConnectionsRedirect = () => (
  <PlanFeatureGuard feature="globalConnections">
    <ToGlobalScope />
  </PlanFeatureGuard>
);

const ToGlobalScope = () => {
  const { search, hash } = useLocation();
  const params = new URLSearchParams(search);
  params.delete('scope');
  params.append('scope', AppConnectionScope.PLATFORM);
  return (
    <Navigate
      to={{
        pathname: '/platform/connections',
        search: `?${params.toString()}`,
        hash,
      }}
      replace
    />
  );
};
