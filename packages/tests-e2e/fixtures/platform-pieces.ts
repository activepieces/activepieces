import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { e2eApi, E2eSession, FlowTemplate, SeededFlow } from './api';
import { test as base } from './index';

export const test = base.extend<{ defaultPieceSet: { id: string }; privatePiece: PrivatePiece }>({
  defaultPieceSet: async ({ request, session }, use) => {
    const before = await e2eApi.callApi<PieceSet>({
      request,
      session,
      method: 'GET',
      path: `/api/v1/piece-sets/projects/${session.projectId}`,
    });
    if (!before.isDefault) {
      throw new Error(`The default project uses piece set ${before.id}, not the Default set: a test moved the project and did not move it back`);
    }
    await use({ id: before.id });
    await e2eApi.callApi({
      request,
      session,
      method: 'POST',
      path: `/api/v1/piece-sets/${before.id}`,
      data: { pieces: before.config.pieces, requiredActions: before.config.requiredActions },
    });
  },

  privatePiece: async ({ request, session }, use) => {
    const pieceIds: string[] = [];
    const flowIds: string[] = [];
    await use({
      name: PRIVATE_PIECE_NAME,
      version: '0.0.1',
      displayName: 'E2E Custom Echo',
      archive: {
        name: 'e2e-custom-echo-0.0.1.tgz',
        mimeType: 'application/gzip',
        buffer: readFileSync(path.join(__dirname, 'pieces', 'e2e-custom-echo-0.0.1.tgz')),
      },
      trackInstalled: async () => {
        const piece = await e2eApi.callApi<InstalledPiece>({
          request,
          session,
          method: 'GET',
          path: `/api/v1/pieces/${encodeURIComponent(PRIVATE_PIECE_NAME)}`,
          params: { projectId: session.projectId },
        });
        pieceIds.push(piece.id);
        return piece;
      },
      seedFlow: ({ template }) => e2eApi.seedFlow({
        request,
        session,
        template,
        publish: true,
        connections: {},
        onCreated: (flowId) => flowIds.push(flowId),
      }),
    });
    for (const flowId of flowIds) {
      await e2eApi.deleteFlow({ request, session, flowId });
    }
    const installedIds = pieceIds.length > 0 ? pieceIds : await findInstalledPieceIds({ request, session });
    for (const pieceId of installedIds) {
      await deletePieceOnceUnused({ request, session, pieceId });
    }
  },
});

export { expect } from '@playwright/test';

async function findInstalledPieceIds({ request, session }: { request: APIRequestContext; session: E2eSession }): Promise<string[]> {
  const response = await request.get(`/api/v1/pieces/${encodeURIComponent(PRIVATE_PIECE_NAME)}`, {
    headers: { Authorization: `Bearer ${session.token}` },
    params: { projectId: session.projectId },
  });
  if (!response.ok()) {
    return [];
  }
  const piece: InstalledPiece = await response.json();
  return [piece.id];
}

async function deletePieceOnceUnused({ request, session, pieceId }: { request: APIRequestContext; session: E2eSession; pieceId: string }) {
  await expect(async () => {
    await e2eApi.deleteById({ request, session, resource: 'pieces', id: pieceId });
  }, 'A flow that uses the private piece is still being deleted').toPass({ timeout: PIECE_DELETE_TIMEOUT_MS });
}

const PRIVATE_PIECE_NAME = 'e2e-custom-echo';
const PIECE_DELETE_TIMEOUT_MS = 60_000;

type PieceSet = {
  id: string;
  isDefault: boolean;
  config: {
    pieces: { mode: string; exceptions: string[] };
    requiredActions: { mode: string; actions: Record<string, string[]> };
  };
};

type InstalledPiece = { id: string; name: string; version: string; pieceType: string; packageType: string };

type PrivatePiece = {
  name: string;
  version: string;
  displayName: string;
  archive: { name: string; mimeType: string; buffer: Buffer };
  trackInstalled: () => Promise<InstalledPiece>;
  seedFlow: (params: { template: FlowTemplate }) => Promise<SeededFlow>;
};
