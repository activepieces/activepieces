import { isNil } from '@activepieces/core-utils';
import { t } from 'i18next';
import React from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { projectCollectionUtils } from '@/features/projects';

import { authenticationSession } from '../../lib/authentication-session';
import { RouteHandle } from '../components/app-shell';
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
  return (
    <ProjectAccessGuard
      key={projectIdFromParams}
      projectId={projectIdFromParams}
    >
      {children}
    </ProjectAccessGuard>
  );
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
      to={`/projects/${currentProjectId}${pathWithParamsAndSearchParams}`}
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

function ProjectAccessGuard({
  projectId,
  children,
}: {
  projectId: string;
  children: React.ReactNode;
}) {
  const hasAccessToProject = projectCollectionUtils.useAdoptProject(projectId);

  if (!hasAccessToProject) {
    toast.error(t('Invalid Access'), {
      description: t(
        'You tried to access a project that you do not have access to.',
      ),
      duration: 10000,
    });
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
