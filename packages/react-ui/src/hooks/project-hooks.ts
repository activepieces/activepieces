import {
  useQuery,
  QueryClient,
  usePrefetchQuery,
  useSuspenseQuery,
} from '@tanstack/react-query';

import { authenticationApi } from '@/lib/authentication-api';
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
  prefetchProjectRole: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    usePrefetchQuery({
      queryKey: ['project-role', authenticationSession.getProjectId()],
      queryFn: async () => authenticationApi.me(),
      staleTime: Infinity,
    });
  },
  useCurrentProject: () => {
    const query = useSuspenseQuery<ProjectWithLimits, Error>({
      queryKey: ['current-project'],
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
