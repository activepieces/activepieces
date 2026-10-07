import React from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';

export function LegacyTabRedirect({
  basePath,
  tabPaths,
  children,
}: LegacyTabRedirectProps) {
  const [searchParams] = useSearchParams();
  const { hash } = useLocation();
  const legacyTab = searchParams.get('tab');

  if (legacyTab === null || !Object.hasOwn(tabPaths, legacyTab)) {
    return <>{children}</>;
  }

  const segment = tabPaths[legacyTab];
  const remaining = new URLSearchParams(searchParams);
  remaining.delete('tab');

  return (
    <Navigate
      to={{
        pathname: segment === '' ? basePath : `${basePath}/${segment}`,
        search: remaining.toString(),
        hash,
      }}
      replace
    />
  );
}

type LegacyTabRedirectProps = {
  basePath: string;
  tabPaths: Record<string, string>;
  children: React.ReactNode;
};
