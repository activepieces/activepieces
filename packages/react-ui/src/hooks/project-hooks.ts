import {
  useQuery,
  QueryClient,
  usePrefetchQuery,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { t } from 'i18next';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { toast } from '@/components/ui/use-toast';
import { authenticationSession } from '@/lib/authentication-session';
import { determineDefaultRoute } from '@/lib/utils';
import { UpdateProjectPlatformRequest } from '@activepieces/ee-shared';
import { ProjectWithLimits } from '@activepieces/shared';

import { projectApi } from '../lib/project-api';

import { useAuthorization } from './authorization-hooks';

export const projectHooks = {
  prefetchProject: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    usePrefetchQuery<ProjectWithLimits, Error>({
      queryKey: ['current-project'],
      queryFn: projectApi.current,
      staleTime: Infinity,
    });
  },
  useCurrentProject: () => {
    const currentProjectId = authenticationSession.getProjectId();
    const query = useSuspenseQuery<ProjectWithLimits, Error>({
      queryKey: ['current-project', currentProjectId],
      queryFn: projectApi.current,
      staleTime: Infinity,
    });
    return {
      ...query,
      project: query.data,
      updateProject,
      setCurrentProject,
    };
  },
  useProjects: () => {
    return useQuery<ProjectWithLimits[], Error>({
      queryKey: ['projects'],
      queryFn: async () => {
        const results = await projectApi.list({
          cursor: undefined,
          limit: 1000,
        });
        return results.data;
      },
    });
  },
};

const updateProject = async (
  queryClient: QueryClient,
  request: UpdateProjectPlatformRequest,
) => {
  queryClient.setQueryData(['current-project'], {
    ...queryClient.getQueryData(['current-project'])!,
    ...request,
  });
};

const setCurrentProject = async (
  queryClient: QueryClient,
  project: ProjectWithLimits,
  pathName?: string,
) => {
  await authenticationSession.switchToSession(project.id);
  queryClient.setQueryData(['current-project'], project);
  if (pathName) {
    const pathNameWithNewProjectId = pathName.replace(
      /\/projects\/\w+/,
      `/projects/${project.id}`,
    );
    window.location.href = pathNameWithNewProjectId;
  }
};

export const useRedirectToHomeIfProjectIdChanged = (projectId: string) => {
  const navigate = useNavigate();
  const { checkAccess } = useAuthorization();
  useEffect(() => {
    const handleVisibilityChange = () => {
      const currentProjectId = authenticationSession.getProjectId();
      if (
        currentProjectId !== projectId &&
        document.visibilityState === 'visible'
      ) {
        toast({
          title: t('Project changed'),
          description: t('You have been redirected to the home page'),
        });
        navigate(determineDefaultRoute(checkAccess));
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [projectId]);
};
