import { useSuspenseQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import React from 'react';
import { useParams, Navigate } from 'react-router-dom';

import { useEmbedding } from '@/components/embed-provider';
import { useToast } from '@/components/ui/use-toast';
import { flagsHooks } from '@/hooks/flags-hooks';
import { api } from '@/lib/api';
import { ApEdition, ApFlagId, isNil } from '@activepieces/shared';

import { authenticationSession } from '../../lib/authentication-session';

const TokenCheckerWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { projectId } = useParams<{ projectId: string }>();
  const currentProjectId = authenticationSession.getProjectId();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

  const { toast } = useToast();
  const { data: isProjectValid, isError } = useSuspenseQuery<boolean, Error>({
    queryKey: ['switch-to-project', projectId],
    queryFn: async () => {
      if (edition === ApEdition.COMMUNITY) {
        return true;
      }
      if (isNil(projectId)) {
        return false;
      }
      try {
        await authenticationSession.switchToSession(projectId!);
        return true;
      } catch (error) {
        if (api.isError(error) && error.response?.status === 401) {
          toast({
            duration: 3000,
            title: t('Invalid Access'),
            description: t(
              'Either the project does not exist or you do not have access to it.',
            ),
          });
          authenticationSession.clearSession();
        }
        return false;
      }
    },
    retry: false,
    staleTime: Infinity,
  });

  if (isNil(currentProjectId) || isNil(projectId)) {
    return <Navigate to="/sign-in" replace />;
  }

  if (isError || !isProjectValid) {
    return <Navigate to="/404" replace />;
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

  return (
    <Navigate to={`/projects/${currentProjectId}${pathWithParams}`} replace />
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
