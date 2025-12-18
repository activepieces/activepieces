import {
  useQuery,
  QueryClient,
  useSuspenseQuery,
  useInfiniteQuery,
  InfiniteData,
} from '@tanstack/react-query';
import { HttpStatusCode } from 'axios';
import { t } from 'i18next';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { useEmbedding } from '@/components/embed-provider';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { UpdateProjectPlatformRequest } from '@activepieces/ee-shared';
import {
  ApEdition,
  ApFlagId,
  isNil,
  ProjectType,
  ProjectWithLimits,
  ProjectWithLimitsWithPlatform,
  SeekPage,
  ListProjectRequestForUserQueryParams,
} from '@activepieces/shared';

import { projectApi } from '../lib/project-api';

import { flagsHooks } from './flags-hooks';

const PERSONAL_PROJECT_NAME = 'Personal Project';

export const getProjectName = (project: ProjectWithLimits): string => {
  return project.type === ProjectType.PERSONAL
    ? PERSONAL_PROJECT_NAME
    : project.displayName;
};

export const projectHooks = {
  useCurrentProject: () => {
    const currentProjectId = authenticationSession.getProjectId();
    const query = useSuspenseQuery<ProjectWithLimits, Error>({
      queryKey: ['current-project', currentProjectId],
      queryFn: projectApi.current,
    });
    return {
      ...query,
      project: query.data,
      updateCurrentProject,
      setCurrentProject,
    };
  },
  useProjects: (params?: ListProjectRequestForUserQueryParams) => {
    const { limit = 1000, displayName, cursor, ...restParams } = params || {};
    return useQuery<ProjectWithLimits[], Error>({
      queryKey: ['projects', params],
      queryFn: async () => {
        const results = await projectApi.list({
          cursor,
          limit,
          displayName,
          ...restParams,
        });
        return results.data;
      },
      enabled: !displayName || displayName.length > 0,
    });
  },
  useProjectsInfinite: (limit = 20) => {
    return useInfiniteQuery<
      SeekPage<ProjectWithLimits>,
      Error,
      InfiniteData<SeekPage<ProjectWithLimits>>
    >({
      queryKey: ['projects-infinite', limit],
      getNextPageParam: (lastPage) => lastPage.next,
      initialPageParam: undefined,
      queryFn: ({ pageParam }) =>
        projectApi.list({
          cursor: pageParam as string | undefined,
          limit,
        }),
    });
  },
  useProjectsForPlatforms: () => {
    return useQuery<ProjectWithLimitsWithPlatform[], Error>({
      queryKey: ['projects-for-platforms'],
      queryFn: async () => {
        return projectApi.listForPlatforms();
      },
    });
  },
  useReloadPageIfProjectIdChanged: (projectId: string) => {
    const { embedState } = useEmbedding();
    useEffect(() => {
      const handleVisibilityChange = () => {
        const currentProjectId = authenticationSession.getProjectId();
        if (
          currentProjectId !== projectId &&
          document.visibilityState === 'visible' &&
          !embedState.isEmbedded
        ) {
          window.location.reload();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener(
          'visibilitychange',
          handleVisibilityChange,
        );
      };
    }, [projectId, embedState.isEmbedded]);
  },
  useSwitchToProjectInParams: () => {
    const { projectId: projectIdFromParams } = useParams<{
      projectId: string;
    }>();
    const projectIdFromToken = authenticationSession.getProjectId();
    const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

    const query = useSuspenseQuery<boolean, Error>({
      //added currentProjectId in case user switches project and goes back to the same project
      queryKey: ['switch-to-project', projectIdFromParams, projectIdFromToken],
      queryFn: async () => {
        if (edition === ApEdition.COMMUNITY) {
          return true;
        }
        if (isNil(projectIdFromParams)) {
          return false;
        }
        try {
          await authenticationSession.switchToProject(projectIdFromParams);
          return true;
        } catch (error) {
          if (
            api.isError(error) &&
            (error.response?.status === HttpStatusCode.BadRequest ||
              error.response?.status === HttpStatusCode.Forbidden)
          ) {
            toast.error(t('Invalid Access'), {
              description: t(
                'Either the project does not exist or you do not have access to it.',
              ),
              duration: 10000,
            });
          }
          return false;
        }
      },
      retry: false,
      staleTime: 0,
    });

    return {
      projectIdFromParams,
      projectIdFromToken,
      ...query,
    };
  },
};

const updateCurrentProject = async (
  queryClient: QueryClient,
  request: UpdateProjectPlatformRequest,
) => {
  const currentProjectId = authenticationSession.getProjectId();
  queryClient.setQueryData(['current-project', currentProjectId], {
    ...queryClient.getQueryData(['current-project', currentProjectId])!,
    ...request,
  });
};

const setCurrentProject = async (
  queryClient: QueryClient,
  project: ProjectWithLimits,
  pathName?: string,
) => {
  await authenticationSession.switchToProject(project.id);
  queryClient.setQueryData(['current-project'], project);
  if (pathName) {
    const pathNameWithNewProjectId = pathName.replace(
      /\/projects\/\w+/,
      `/projects/${project.id}`,
    );
    window.location.href = pathNameWithNewProjectId;
  }
};
