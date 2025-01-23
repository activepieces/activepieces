import React from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';

import { useEmbedding } from '@/components/embed-provider';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { determineDefaultRoute } from '@/lib/utils';
import { isNil } from '@activepieces/shared';

import { authenticationSession } from '../../lib/authentication-session';
import { LoadingScreen } from '../components/loading-screen';

export const TokenCheckerWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const {
    isError,
    error,
    data: isProjectValid,
    projectIdFromParams,
    isLoading,
    isFetching,
  } = projectHooks.useSwitchToProjectInParams();
  const { checkAccess } = useAuthorization();
  if (isNil(projectIdFromParams) || isNil(projectIdFromParams)) {
    return <Navigate to="/sign-in" replace />;
  }
  const failedToSwitchToProject =
    !isProjectValid && !isNil(projectIdFromParams);
  if (failedToSwitchToProject) {
    const defaultRoute = determineDefaultRoute(checkAccess);
    return <Navigate to={defaultRoute} replace />;
  }
  if (isError || !isProjectValid) {
    console.log({ isError, isProjectValid, error });
    return <Navigate to="/" replace />;
  }
  //TODO: after upgrading react, we should use (use) hook to trigger suspense instead of this
  if (isLoading || isFetching) {
    return <LoadingScreen></LoadingScreen>;
  }
  return <>{children}</>;
};

type RedirectToCurrentProjectRouteProps = {
  path: string;
  children: React.ReactNode;
};
const RedirectToCurrentProjectRoute: React.FC<
  RedirectToCurrentProjectRouteProps
> = ({ path, children }) => {
  const currentProjectId = authenticationSession.getProjectId();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const { embedState } = useEmbedding();
  if (isNil(currentProjectId)) {
    return <Navigate to="/sign-in" replace />;
  }
  if (embedState.isEmbedded) {
    return children;
  }

  const pathWithParams = `${path.startsWith('/') ? path : `/${path}`}`.replace(
    /:(\w+)/g,
    (_, param) => params[param] ?? '',
  );

  const searchParamsString = searchParams.toString();
  const pathWithParamsAndSearchParams = `${pathWithParams}${
    searchParamsString ? `?${searchParamsString}` : ''
  }`;

  return (
    <Navigate
      to={`/projects/${currentProjectId}${pathWithParamsAndSearchParams}`}
      replace
    />
  );
};

interface ProjectRouterWrapperProps {
  path: string;
  element: React.ReactNode;
}

export const ProjectRouterWrapper = ({
  element,
  path,
}: ProjectRouterWrapperProps) => [
  {
    path: `/projects/:projectId${path.startsWith('/') ? path : `/${path}`}`,
    element: <TokenCheckerWrapper>{element}</TokenCheckerWrapper>,
  },
  {
    path,
    element: (
      <RedirectToCurrentProjectRoute path={path}>
        {element}
      </RedirectToCurrentProjectRoute>
    ),
  },
];
