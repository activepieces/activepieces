import { queryCollectionOptions } from '@tanstack/query-db-collection';
import {
  createCollection,
  eq,
  or,
  useLiveSuspenseQuery,
} from '@tanstack/react-db';
import { QueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { useEmbedding } from '@/components/embed-provider';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import {
  CreatePlatformProjectRequest,
  ListProjectRequestForPlatformQueryParams,
  UpdateProjectPlatformRequest,
} from '@activepieces/ee-shared';
import {
  isNil,
  ProjectType,
  ProjectWithLimits,
  ProjectWithLimitsWithPlatform,
  SeekPage,
} from '@activepieces/shared';

const collectionQueryClient = new QueryClient();

export const projectCollection = createCollection<ProjectWithLimits, string>(
  queryCollectionOptions({
    queryKey: ['projects'],
    queryClient: collectionQueryClient,
    queryFn: async () => {
      const request: ListProjectRequestForPlatformQueryParams = {
        cursor: undefined,
        limit: 30000,
      };
      const response = await api.get<SeekPage<ProjectWithLimits>>(
        '/v1/projects',
        request,
      );
      return response.data;
    },
    getKey: (item) => item.id,
    onUpdate: async ({ transaction }) => {
      for (const { original, modified } of transaction.mutations) {
        const request: UpdateProjectPlatformRequest = {
          displayName: modified.displayName,
          metadata: modified.metadata ?? undefined,
          releasesEnabled: modified.releasesEnabled,
          externalId:
            !isNil(modified.externalId) && modified.externalId.trim() !== ''
              ? modified.externalId
              : undefined,
          icon: modified.icon,
          plan: modified.plan,
        };
        await api.post<ProjectWithLimits>(
          `/v1/projects/${original.id}`,
          request,
        );
      }
    },
    onInsert: async ({ transaction }) => {
      for (const { modified } of transaction.mutations) {
        await api.post<ProjectWithLimits>('/v1/projects', modified);
      }
    },
    onDelete: async ({ transaction }) => {
      for (const { original } of transaction.mutations) {
        await api.delete<void>(`/v1/projects/${original.id}`);
      }
    },
  }),
);

export const projectCollectionUtils = {
  useCreateProject: (
    onSuccess: (project: ProjectWithLimits) => void,
    onError: (error: Error) => void,
  ) => {
    return useMutation({
      mutationFn: (request: CreatePlatformProjectRequest) =>
        api.post<ProjectWithLimits>('/v1/projects', request),
      onSuccess: (data) => {
        projectCollection.utils.writeInsert(data);
        onSuccess(data);
      },
      onError: (error) => {
        onError(error);
      },
    });
  },
  update: (projectId: string, request: UpdateProjectPlatformRequest) => {
    projectCollection.update(projectId, (draft) => {
      Object.assign(
        draft,
        Object.fromEntries(
          Object.entries(request).filter(([_, value]) => value !== undefined),
        ),
      );
    });
  },
  delete: (projectIds: string[]) => {
    projectCollection.delete(projectIds);
  },
  setCurrentProject: (projectId: string, pathName?: string) => {
    authenticationSession.switchToProject(projectId);
    if (pathName) {
      const pathNameWithNewProjectId = pathName.replace(
        /\/projects\/\w+/,
        `/projects/${projectId}`,
      );
      window.location.href = pathNameWithNewProjectId;
    }
  },
  useCurrentProject: () => {
    const projectId = authenticationSession.getProjectId();
    const { data } = useLiveSuspenseQuery(
      (q) =>
        q
          .from({ project: projectCollection })
          .where(({ project }) => eq(project.id, projectId))
          .select(({ project }) => ({ ...project }))
          .findOne(),
      [projectId],
    );
    return {
      project: data!,
    };
  },
  useAll: () => {
    const currentUserId = authenticationSession.getCurrentUserId();
    return useLiveSuspenseQuery(
      (q) =>
        q
          .from({ project: projectCollection })
          .where(({ project }) =>
            or(
              eq(project.type, ProjectType.TEAM),
              eq(project.ownerId, currentUserId),
            ),
          )
          .orderBy(({ project }) => project.type, 'asc')
          .orderBy(({ project }) => project.created, 'asc')
          .select(({ project }) => ({ ...project })),
      [currentUserId],
    );
  },
  useHasAccessToProject: (projectId: string) => {
    const { data } = useLiveSuspenseQuery((q) =>
      q
        .from({ project: projectCollection })
        .where(({ project }) => eq(project.id, projectId))
        .select(({ project }) => ({ ...project }))
        .findOne(),
    );
    return !isNil(data);
  },
};

export const getProjectName = (project: ProjectWithLimits): string => {
  return project.type === ProjectType.PERSONAL
    ? 'Personal Project'
    : project.displayName;
};
export const projectHooks = {
  useProjectsForPlatforms: () => {
    return useQuery<ProjectWithLimitsWithPlatform[], Error>({
      queryKey: ['projects-for-platforms'],
      queryFn: async () => {
        return api.get<ProjectWithLimitsWithPlatform[]>(
          '/v1/users/projects/platforms',
        );
      },
    });
  },
  useReloadPageIfProjectIdChanged: (projectId: string) => {
    const { embedState } = useEmbedding();
    const location = useLocation();
    useEffect(() => {
      const handleVisibilityChange = () => {
        const currentProjectId = authenticationSession.getProjectId();
        const isTemplateRoute = location.pathname.startsWith('/templates');
        if (
          currentProjectId !== projectId &&
          document.visibilityState === 'visible' &&
          !embedState.isEmbedded &&
          !isTemplateRoute
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
    }, [projectId, embedState.isEmbedded, location.pathname]);
  },
};
