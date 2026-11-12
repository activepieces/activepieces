import { isNil } from '@activepieces/core-utils';
import { t } from 'i18next';
import React from 'react';
import {
  Navigate,
  useLocation,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { toast } from 'sonner';

import { projectCollectionUtils } from '@/features/projects';
import { RouteHandle } from '@/lib/shell-handle';

import { authenticationSession } from '../../lib/authentication-session';
import { NoProjectsState } from '../components/no-projects-state';

export const TokenCheckerWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { projectId: projectIdFromParams } = useParams<{
    projectId: string;
  }>();

  if (isNil(projectIdFromParams)) {
    return <Navigate to="/sign-in" replace />;
  }
  const hasAccessToProject =
    projectCollectionUtils.useHasAccessToProject(projectIdFromParams);

  if (!hasAccessToProject) {
    toast.error(t('Invalid Access'), {
      description: t(
        'You tried to access a project that you do not have access to.',
      ),
      duration: 10000,
    });
    return <Navigate to="/" replace />;
  }

  authenticationSession.switchToProject(projectIdFromParams);

  return <>{children}</>;
};

type RedirectToCurrentProjectRouteProps = {
  path: string;
  children: React.ReactNode;
};
const RedirectToCurrentProjectRoute: React.FC<
  RedirectToCurrentProjectRouteProps
> = ({ path }) => {
  const currentProjectId = authenticationSession.getProjectId();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const { hash } = useLocation();
  if (isNil(currentProjectId)) {
    return <NoProjectsState />;
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
      to={`/projects/${currentProjectId}${pathWithParamsAndSearchParams}${hash}`}
      replace
    />
  );
};

interface ProjectRouterWrapperProps {
  path: string;
  element: React.ReactNode;
  handle: RouteHandle;
}

export const ProjectRouterWrapper = ({
  element,
  path,
  handle,
}: ProjectRouterWrapperProps) => [
  {
    path: `/projects/:projectId${path.startsWith('/') ? path : `/${path}`}`,
    handle,
    element: <TokenCheckerWrapper>{element}</TokenCheckerWrapper>,
  },
  {
    path,
    handle,
    element: (
      <RedirectToCurrentProjectRoute path={path}>
        {element}
      </RedirectToCurrentProjectRoute>
    ),
  },
];
