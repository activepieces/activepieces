import {
  useQuery,
  QueryClient,
  usePrefetchQuery,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { useEffect } from 'react';

import { authenticationSession } from '@/lib/authentication-session';
import { UpdateProjectPlatformRequest } from '@activepieces/ee-shared';
import { ProjectWithLimits } from '@activepieces/shared';

import { projectApi } from '../lib/project-api';

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

export const useReloadPageIfProjectIdChanged = (projectId: string) => {
  useEffect(() => {
    const handleVisibilityChange = () => {
      const currentProjectId = authenticationSession.getProjectId();
      if (
        currentProjectId !== projectId &&
        document.visibilityState === 'visible'
      ) {
        console.log('Project changed', currentProjectId, projectId);
        window.location.reload();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [projectId]);
};
