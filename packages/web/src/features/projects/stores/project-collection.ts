import { isNil, SeekPage } from '@activepieces/core-utils';
import {
  CreatePlatformProjectRequest,
  ListProjectRequestForPlatformQueryParams,
  UpdateProjectPlatformRequest,
  ProjectType,
  ProjectWithLimits,
  ProjectWithLimitsWithPlatform,
} from '@activepieces/shared';
import { queryCollectionOptions } from '@tanstack/query-db-collection';
import {
  and,
  createCollection,
  eq,
  like,
  or,
  useLiveSuspenseQuery,
} from '@tanstack/react-db';
import { QueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { useEmbedding } from '@/components/providers/embed-provider';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { mutationFeedback } from '@/lib/mutation-feedback';

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
      const saved: ProjectWithLimits[] = [];
      for (const { original, modified } of transaction.mutations) {
        const request: UpdateProjectPlatformRequest = {
          ...modified,
          metadata: modified.metadata ?? undefined,
          externalId: modified.externalId?.trim() || undefined,
        };
        saved.push(
          await api.post<ProjectWithLimits>(
            `/v1/projects/${original.id}`,
            request,
          ),
        );
      }
      projectCollection.utils.writeBatch(() => {
        saved.forEach((project) =>
          projectCollection.utils.writeUpdate(project),
        );
      });
      return { refetch: false };
    },
    onInsert: async ({ transaction }) => {
      const created: ProjectWithLimits[] = [];
      for (const { modified } of transaction.mutations) {
        created.push(
          await api.post<ProjectWithLimits>('/v1/projects', modified),
        );
      }
      projectCollection.utils.writeBatch(() => {
        created.forEach((project) =>
          projectCollection.utils.writeInsert(project),
        );
      });
      return { refetch: false };
    },
    onDelete: async ({ transaction }) => {
      const deleted: string[] = [];
      for (const { original } of transaction.mutations) {
        await api.delete<void>(`/v1/projects/${original.id}`);
        deleted.push(original.id);
      }
      projectCollection.utils.writeBatch(() => {
        deleted.forEach((id) => projectCollection.utils.writeDelete(id));
      });
      return { refetch: false };
    },
  }),
);

let authoritativeProjectsGeneration = 0;

function reportProjectError(error: unknown) {
  mutationFeedback.error({ error, title: t("Couldn't save changes") });
}

export const projectCollectionUtils = {
  useCreateProject: (
    onSuccess: (project: ProjectWithLimits) => void,
    onError: (error: Error) => void = reportProjectError,
  ) => {
    return useMutation({
      mutationFn: (request: CreatePlatformProjectRequest) =>
        api.post<ProjectWithLimits>('/v1/projects', request),
      onSuccess: async (data) => {
        await projectCollection.preload();
        projectCollection.utils.writeInsert(data);
        onSuccess(data);
      },
      onError,
    });
  },
  useUpdateProject: (
    onSuccess: () => void,
    onError: (error: Error) => void = reportProjectError,
  ) => {
    return useMutation({
      mutationFn: ({
        projectId,
        request,
      }: {
        projectId: string;
        request: UpdateProjectPlatformRequest;
      }) => api.post<ProjectWithLimits>(`/v1/projects/${projectId}`, request),
      onSuccess: async (data) => {
        await projectCollection.preload();
        projectCollection.utils.writeUpdate(data);
        onSuccess();
      },
      onError,
    });
  },
  update: (projectId: string, request: UpdateProjectPlatformRequest) => {
    const transaction = projectCollection.update(projectId, (draft) => {
      Object.assign(
        draft,
        Object.fromEntries(
          Object.entries(request).filter(([_, value]) => value !== undefined),
        ),
      );
    });
    transaction.isPersisted.promise.catch(reportProjectError);
    return transaction;
  },
  delete: (projectIds: string[]) => {
    const transaction = projectCollection.delete(projectIds);
    transaction.isPersisted.promise.catch((error: unknown) =>
      mutationFeedback.error({ error, title: t("Couldn't delete project") }),
    );
    return transaction;
  },
  refetchProjects: () => {
    authoritativeProjectsGeneration += 1;
    return projectCollection.utils.refetch();
  },
  markFlowActivity: ({
    projectId,
    lastFlowUpdated,
  }: {
    projectId: string;
    lastFlowUpdated: string;
  }) => {
    const generation = authoritativeProjectsGeneration;
    const write = () => {
      if (generation !== authoritativeProjectsGeneration) {
        return;
      }
      const project = projectCollection.get(projectId);
      if (isNil(project)) {
        return;
      }
      const current = project.analytics.lastFlowUpdated;
      const isNewer =
        isNil(current) ||
        new Date(lastFlowUpdated).getTime() > new Date(current).getTime();
      if (!isNewer) {
        return;
      }
      projectCollection.utils.writeUpdate({
        ...project,
        analytics: {
          ...project.analytics,
          lastFlowUpdated,
        },
      });
    };
    requestAnimationFrame(() => requestAnimationFrame(write));
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
              and(
                eq(project.type, ProjectType.PERSONAL),
                eq(project.ownerId, currentUserId),
              ),
            ),
          )
          .orderBy(({ project }) => project.type, 'asc')
          .orderBy(({ project }) => project.created, 'asc')
          .select(({ project }) => ({ ...project })),
      [currentUserId],
    );
  },
  useAllPlatformProjects: (filters?: {
    displayName?: string;
    type?: ProjectType[];
  }) => {
    return useLiveSuspenseQuery(
      (q) => {
        let query = q.from({ project: projectCollection });

        if (filters?.displayName) {
          query = query.where(({ project }) =>
            like(project.displayName, `%${filters.displayName}%`),
          );
        }

        if (filters?.type && filters.type.length > 0) {
          query = query.where(({ project }) => {
            const types = filters.type!;
            if (types.length === 1) {
              return eq(project.type, types[0]);
            }
            const conditions = types.map((t) => eq(project.type, t)) as [
              any,
              any,
              ...any[],
            ];
            return or(...conditions);
          });
        }

        return query
          .orderBy(({ project }) => project.type, 'asc')
          .orderBy(({ project }) => project.created, 'asc')
          .select(({ project }) => ({ ...project }));
      },
      [filters?.displayName, filters?.type?.join(',')],
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

export const getProjectName = (
  project: Pick<ProjectWithLimits, 'type' | 'displayName'>,
): string => {
  return project.type === ProjectType.PERSONAL
    ? 'Personal Project'
    : project.displayName;
};
export const projectHooks = {
  useProjectsForPlatforms: () => {
    return useQuery<ProjectWithLimitsWithPlatform[], Error>({
      queryKey: ['projects-for-platforms'],
      queryFn: async () => {
        return api.get<ProjectWithLimitsWithPlatform[]>('/v1/platforms');
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
