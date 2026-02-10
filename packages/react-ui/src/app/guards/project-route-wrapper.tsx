import { t } from 'i18next';
import React from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { projectCollectionUtils } from '@/hooks/project-collection';
import {
  FROM_QUERY_PARAM,
  useDefaultRedirectPath,
} from '@/lib/navigation-utils';
import { isNil } from '@activepieces/shared';

import { authenticationSession } from '../../lib/authentication-session';
import { AllowOnlyLoggedInUserOnlyGuard } from '../components/allow-logged-in-user-only-guard';

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
  const defaultRedirectPath = useDefaultRedirectPath();
  const from = searchParams.get(FROM_QUERY_PARAM) ?? defaultRedirectPath;
  if (isNil(currentProjectId)) {
    return (
      <Navigate
        to={`/sign-in?${new URLSearchParams({ from }).toString()}`}
        replace
      />
    );
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
    element: (
      <AllowOnlyLoggedInUserOnlyGuard>
        <TokenCheckerWrapper>{element}</TokenCheckerWrapper>
      </AllowOnlyLoggedInUserOnlyGuard>
    ),
  },
  {
    path,
    element: (
      <AllowOnlyLoggedInUserOnlyGuard>
        <RedirectToCurrentProjectRoute path={path}>
          {element}
        </RedirectToCurrentProjectRoute>
      </AllowOnlyLoggedInUserOnlyGuard>
    ),
  },
];
