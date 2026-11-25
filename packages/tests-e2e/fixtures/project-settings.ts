import { e2eApi, E2eSession } from './api';
import { test as base } from './index';

export const test = base.extend<{ pieceSets: PieceSets }>({
  pieceSets: async ({ request, session, cleanup }, use) => {
    await use({
      hidePiece: async ({ projectId, pieceName }) => {
        const pieceSet = await e2eApi.callApi<{ id: string; name: string }>({
          request,
          session,
          method: 'POST',
          path: '/api/v1/piece-sets',
          data: { name: e2eApi.uniqueName('piece set') },
        });
        cleanup.track({ resource: 'piece-sets', id: pieceSet.id });
        await e2eApi.callApi({
          request,
          session,
          method: 'POST',
          path: `/api/v1/piece-sets/${pieceSet.id}`,
          data: { pieces: { mode: 'include_all', exceptions: [pieceName] } },
        });
        const assigned = await e2eApi.callApiStatus({
          request,
          session,
          method: 'POST',
          path: `/api/v1/piece-sets/${pieceSet.id}/projects`,
          data: { projectIds: [projectId] },
        });
        if (assigned !== 204) {
          throw new Error(`Giving piece set ${pieceSet.id} to project ${projectId} failed with ${assigned}`);
        }
        return { id: pieceSet.id, name: pieceSet.name };
      },
      readForProject: ({ projectId, session: reader = session }) => e2eApi.callApi<ProjectPieceSet>({
        request,
        session: reader,
        method: 'GET',
        path: `/api/v1/piece-sets/projects/${projectId}`,
      }),
      pieceNames: async ({ session: projectSession }) => {
        const pieces = await e2eApi.callApi<{ name: string }[]>({
          request,
          session: projectSession,
          method: 'GET',
          path: '/api/v1/pieces',
          params: { projectId: projectSession.projectId },
        });
        return pieces.map((piece) => piece.name);
      },
    });
  },
});

export { expect } from '@playwright/test';

type ProjectPieceSet = { id: string; name: string; config: { pieces: { mode: string; exceptions: string[] } } };

type PieceSets = {
  hidePiece: (params: { projectId: string; pieceName: string }) => Promise<{ id: string; name: string }>;
  readForProject: (params: { projectId: string; session?: E2eSession }) => Promise<ProjectPieceSet>;
  pieceNames: (params: { session: E2eSession }) => Promise<string[]>;
};
