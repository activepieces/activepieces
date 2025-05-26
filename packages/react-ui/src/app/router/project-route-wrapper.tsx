import React, { useEffect } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';

import { useAuthorization } from '@/hooks/authorization-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import {
  DEFAULT_REDIRECT_PATH,
  FROM_QUERY_PARAM,
} from '@/lib/navigation-utils';
import { determineDefaultRoute } from '@/lib/utils';
import { ApFlagId, isNil } from '@activepieces/shared';

import { LoadingScreen } from '../../components/ui/loading-screen';
import { authenticationSession } from '../../lib/authentication-session';
import { FloatingChatButton } from '@/components/custom/FloatingChatButton';
import { botxApi } from '../../components/lib/botx-api';
import { useQuery } from '@tanstack/react-query';
import { userHooks } from '../../hooks/user-hooks';
import { AllowOnlyLoggedInUserOnlyGuard } from '../components/allow-logged-in-user-only-guard';
import { flagsHooks } from '@/hooks/flags-hooks';

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
  const { data: user } = userHooks.useCurrentUser();
  const { data: ZERO_API_URL } = flagsHooks.useFlag<string>(
    ApFlagId.ZERO_SERVICE_URL,
  );
  const { data: botxToken, isSuccess } = useQuery({
    queryKey: ['user-botx-jwt', user?.email],
    queryFn: () =>
      botxApi({ ZERO_API_URL }).getSignBotxJwt({
        email: user?.email || '',
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
      }),
    enabled: !!user && !!ZERO_API_URL, // Run only when user data is available
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });

  useEffect(() => {
    // fetch botx Jwt to get the token that will be used requesting botxApi
    if (isSuccess && botxToken?.token) {
      authenticationSession.saveBotxToken(botxToken?.token);
    }
  }, [isSuccess, botxToken]);

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
> = ({ path }) => {
  const currentProjectId = authenticationSession.getProjectId();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const from = searchParams.get(FROM_QUERY_PARAM) ?? DEFAULT_REDIRECT_PATH;
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
        <TokenCheckerWrapper>
          {element}
          <FloatingChatButton />
        </TokenCheckerWrapper>
      </AllowOnlyLoggedInUserOnlyGuard>
    ),
  },
  {
    path,
    element: (
      <AllowOnlyLoggedInUserOnlyGuard>
        <RedirectToCurrentProjectRoute path={path}>
          {element}
          <FloatingChatButton />
        </RedirectToCurrentProjectRoute>
      </AllowOnlyLoggedInUserOnlyGuard>
    ),
  },
];

export const projectSettingsRoutes = {
  general: '/settings/general',
  appearance: '/settings/appearance',
  team: '/settings/team',
  pieces: '/settings/pieces',
  environments: '/settings/environments',
  alerts: '/settings/alerts',
} as const;
