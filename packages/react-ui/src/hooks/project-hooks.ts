import {
  useQuery,
  QueryClient,
  usePrefetchQuery,
  useSuspenseQuery,
} from '@tanstack/react-query';

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
    });
  },
  useCurrentProject: () => {
    const query = useSuspenseQuery<ProjectWithLimits, Error>({
      queryKey: ['current-project'],
      queryFn: projectApi.current,
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
          limit: 100,
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
  shouldReload = true,
) => {
  const projectChanged = authenticationSession.getProjectId() !== project.id;
  if (projectChanged) {
    await authenticationSession.switchToSession(project.id);
  }
  queryClient.setQueryData(['current-project'], project);
  if (projectChanged && shouldReload) {
    window.location.reload();
  }
};
