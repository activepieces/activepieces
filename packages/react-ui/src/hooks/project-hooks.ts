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
import { NavigateFunction, useNavigate } from 'react-router-dom';

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
          limit: 100,
        });
        return results.data;
      },
    });
  },
  useSwitchToProject: (projectId: string) => {
    const navigate = useNavigate();
    const query = useSuspenseQuery<string,Error>({
      queryKey: ['switch-to-project', projectId],
      queryFn: async () => {
        try{
          await authenticationSession.switchToSession(projectId);
          return projectId;
        }
        catch(e)
        {
          console.error(e);
          navigate('/404');
          return 'error';
        }
      },
     staleTime: 0
    });
    return {
      ...query,
      project: query.data,
    };
  }
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
  pathName?: string ,
) => {
  await authenticationSession.switchToSession(project.id);
  queryClient.setQueryData(['current-project'], project);
  if (pathName) {
    const pathNameWithNewProjectId = pathName.replace(/\/projects\/\w+/, `/projects/${project.id}`);
    window.location.href = pathNameWithNewProjectId;
  }
};
