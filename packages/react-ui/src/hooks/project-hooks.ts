import {
  useQuery,
  QueryClient,
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { HttpStatusCode } from 'axios';
import { t } from 'i18next';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { useEmbedding } from '@/components/embed-provider';
import { useToast, INTERNAL_ERROR_TOAST } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { UpdateProjectPlatformRequest } from '@activepieces/ee-shared';
import {
  ApEdition,
  ApFlagId,
  isNil,
  ProjectWithLimits,
  ProjectWithLimitsWithPlatform,
  ApErrorParams,
  ErrorCode,
} from '@activepieces/shared';

import { projectApi } from '../lib/project-api';

import { flagsHooks } from './flags-hooks';

export const projectHooks = {
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
      updateCurrentProject,
      setCurrentProject,
    };
  },
  useUpdateProject: () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { updateCurrentProject } = projectHooks.useCurrentProject();

    return useMutation<
      ProjectWithLimits,
      Error,
      {
        displayName: string;
        externalId?: string;
        plan: { tasks: number | undefined; aiCredits?: number | undefined };
      }
    >({
      mutationFn: (request) => {
        updateCurrentProject(queryClient, request);
        return projectApi.update(authenticationSession.getProjectId()!, {
          ...request,
          externalId:
            request.externalId?.trim() !== '' ? request.externalId : undefined,
        });
      },
      onSuccess: () => {
        toast({
          title: t('Success'),
          description: t('Your changes have been saved.'),
          duration: 3000,
        });
        queryClient.invalidateQueries({
          queryKey: ['current-project', authenticationSession.getProjectId()],
        });
      },
      onError: (error) => {
        if (api.isError(error)) {
          const apError = error.response?.data as ApErrorParams;
          switch (apError.code) {
            case ErrorCode.PROJECT_EXTERNAL_ID_ALREADY_EXISTS: {
              return {
                code: ErrorCode.PROJECT_EXTERNAL_ID_ALREADY_EXISTS,
                message: t('The external ID is already taken.'),
              };
            }
            default: {
              console.log(error);
              toast(INTERNAL_ERROR_TOAST);
              break;
            }
          }
        }
      },
    });
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
          console.log('Project changed', currentProjectId, projectId);
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
    const { toast } = useToast();

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
            toast({
              duration: 10000,
              title: t('Invalid Access'),
              description: t(
                'Either the project does not exist or you do not have access to it.',
              ),
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
