import { randomUUID } from 'node:crypto';
import { e2eApi } from './api';
import { test as base } from './index';

export const test = base.extend<PlatformConnectionsFixtures>({
  platformConnections: async ({ request, session, cleanup }, use) => {
    await use({
      seedGlobal: async ({ displayName }) => {
        const connection = await e2eApi.callApi<{ id: string }>({
          request,
          session,
          method: 'POST',
          path: '/api/v1/global-connections',
          data: { ...activepiecesConnection({ displayName }), scope: 'PLATFORM', projectIds: [session.projectId] },
        });
        cleanup.track({ resource: 'global-connections', id: connection.id });
      },
      seedInProject: async ({ displayName }) => {
        const connection = await e2eApi.callApi<{ id: string }>({
          request,
          session,
          method: 'POST',
          path: '/api/v1/app-connections',
          data: {
            ...activepiecesConnection({ displayName }),
            projectId: session.projectId,
            externalId: `e2e_${randomUUID().replaceAll('-', '')}`,
          },
        });
        cleanup.track({ resource: 'app-connections', id: connection.id });
      },
    });
  },

  defaultProjectLabel: async ({ request, session }, use) => {
    const project = await e2eApi.callApi<{ type: string; displayName: string }>({
      request,
      session,
      method: 'GET',
      path: `/api/v1/projects/${session.projectId}`,
    });
    await use(project.type === 'PERSONAL' ? 'Personal Project' : project.displayName);
  },
});

export { expect } from '@playwright/test';

function activepiecesConnection({ displayName }: { displayName: string }) {
  return {
    displayName,
    pieceName: '@activepieces/piece-activepieces',
    type: 'CUSTOM_AUTH',
    value: { type: 'CUSTOM_AUTH', props: { baseApiUrl: 'https://example.com/api/v1', apiKey: randomUUID() } },
  };
}

type PlatformConnectionsFixtures = {
  platformConnections: {
    seedGlobal: (params: { displayName: string }) => Promise<void>;
    seedInProject: (params: { displayName: string }) => Promise<void>;
  };
  defaultProjectLabel: string;
};
