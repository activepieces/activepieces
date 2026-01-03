import { queryCollectionOptions } from '@tanstack/query-db-collection';
import {
  createCollection,
  eq,
  or,
  useLiveSuspenseQuery,
} from '@tanstack/react-db';
import { QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useEmbedding } from '@/components/embed-provider';
import { authenticationSession } from '@/lib/authentication-session';
import { projectApi } from '@/lib/project-api';
import { isNil, ProjectType, ProjectWithLimits } from '@activepieces/shared';

const collectionQueryClient = new QueryClient();

export const projectCollection = createCollection<ProjectWithLimits, string>(
  queryCollectionOptions({
    queryKey: ['projects'],
    queryClient: collectionQueryClient,
    queryFn: async () => {
      const response = await projectApi.list({
        cursor: undefined,
        limit: 10000,
      });
      return response.data;
    },
    getKey: (item) => item.id,
    onUpdate: async ({ transaction }) => {
      for (const { original, modified } of transaction.mutations) {
        await projectApi.update(original.id, {
          displayName: modified.displayName,
          metadata: modified.metadata ?? undefined,
          releasesEnabled: modified.releasesEnabled,
          externalId: modified.externalId,
          icon: modified.icon,
          plan: modified.plan,
        });
      }
    },
    onDelete: async ({ transaction }) => {
      for (const { original } of transaction.mutations) {
        await projectApi.delete(original.id);
      }
    },
    onInsert: async ({ transaction }) => {
      for (const { modified } of transaction.mutations) {
        await projectApi.create({
          displayName: modified.displayName,
          metadata: modified.metadata ?? undefined,
          externalId: modified.externalId,
          maxConcurrentJobs: modified.maxConcurrentJobs,
        });
      }
    },
  }),
);

export const projectCollectionUtils = {
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
    const { data } = useLiveSuspenseQuery((q) =>
      q
        .from({ project: projectCollection })
        .where(({ project }) =>
          eq(project.id, authenticationSession.getProjectId()!),
        )
        .select(({ project }) => ({ ...project }))
        .findOne(),
    );
    return {
      project: data!,
    };
  },
  useAll: () => {
    const currentUserId = authenticationSession.getCurrentUserId();
    return useLiveSuspenseQuery((q) =>
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
  return project.type === ProjectType.PERSONAL ?'Personal Project' : project.displayName;
};
export const projectHooks = {
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
};
