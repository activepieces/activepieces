import { useMemo } from 'react';
import {
  matchRoutes,
  Outlet,
  RouteObject,
  useLocation,
} from 'react-router-dom';

import { useEmbedding } from '@/components/providers/embed-provider';

import { useAdminControlClicks } from '../routes/platform/use-admin-control-clicks';

export function AdminControlClicksLayout({
  routes,
}: AdminControlClicksLayoutProps) {
  const { embedState } = useEmbedding();
  const { pathname } = useLocation();
  const page = useMemo(
    () => matchRoutes(routes, pathname)?.[0]?.route.path ?? pathname,
    [routes, pathname],
  );
  useAdminControlClicks({ page, enabled: !embedState.isEmbedded });
  return <Outlet />;
}

type AdminControlClicksLayoutProps = {
  routes: RouteObject[];
};
