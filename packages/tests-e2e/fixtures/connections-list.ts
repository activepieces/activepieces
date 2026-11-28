import { randomUUID } from 'node:crypto';
import { e2eApi, E2eSession, SeededConnection } from './api';
import { test as base } from './index';

export const test = base.extend<{ connectionsList: ConnectionsList }>({
  connectionsList: async ({ request, session, cleanup }, use) => {
    await use({
      newPrefix: () => e2eApi.uniqueName('connections'),
      newConnectionRequest,
      seedConnections: ({ prefix, count, session: projectSession }) => {
        const ownerSession = projectSession ?? session;
        return Promise.all(Array.from({ length: count }, async () => {
          const connection = await e2eApi.callApi<SeededConnection>({
            request,
            session: ownerSession,
            method: 'POST',
            path: CONNECTIONS_PATH,
            data: newConnectionRequest({ displayName: `${prefix} ${randomUUID().slice(0, 8)}`, projectId: ownerSession.projectId }),
          });
          cleanup.track({ resource: 'app-connections', id: connection.id });
          return { id: connection.id, externalId: connection.externalId, displayName: connection.displayName };
        }));
      },
      readConnection: async ({ id }) => {
        const path = `${CONNECTIONS_PATH}/${id}`;
        if (await e2eApi.callApiStatus({ request, session, method: 'GET', path }) === 404) {
          return null;
        }
        return e2eApi.callApi<SeededConnection>({ request, session, method: 'GET', path });
      },
      findByName: async ({ displayName, session: projectSession }) => {
        const ownerSession = projectSession ?? session;
        const page = await e2eApi.callApi<{ data: SeededConnection[] }>({
          request,
          session: ownerSession,
          method: 'GET',
          path: CONNECTIONS_PATH,
          params: { projectId: ownerSession.projectId, displayName, limit: '10' },
        });
        return page.data.filter((connection) => connection.displayName === displayName);
      },
    });
  },
});

export { expect } from '@playwright/test';

function newConnectionRequest({ displayName, projectId }: { displayName: string; projectId: string }) {
  return {
    externalId: `e2e_${randomUUID().replaceAll('-', '')}`,
    displayName,
    pieceName: ACTIVEPIECES_PIECE,
    projectId,
    type: 'NO_AUTH',
    value: { type: 'NO_AUTH' },
  };
}

const CONNECTIONS_PATH = '/api/v1/app-connections';
const ACTIVEPIECES_PIECE = '@activepieces/piece-activepieces';

type ConnectionsList = {
  newPrefix: () => string;
  newConnectionRequest: typeof newConnectionRequest;
  seedConnections: (params: { prefix: string; count: number; session?: E2eSession }) => Promise<SeededConnection[]>;
  readConnection: (params: { id: string }) => Promise<SeededConnection | null>;
  findByName: (params: { displayName: string; session?: E2eSession }) => Promise<SeededConnection[]>;
};
