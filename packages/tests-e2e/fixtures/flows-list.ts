import { randomUUID } from 'node:crypto';
import { e2eApi, E2eSession, FlowTemplate, SeededFlow } from './api';
import { test as base } from './index';
import webhookEcho from './templates/webhook-echo.json';

export const test = base.extend<{ flowsList: FlowsList }>({
  flowsList: async ({ request, session, seed, cleanup }, use) => {
    await use({
      newPrefix: () => `list ${randomUUID().slice(0, 8)}`,
      seedFlows: ({ prefix, count, publish, session: projectSession }) => Promise.all(
        Array.from({ length: count }, () => seed.flow({ template: prefixedTemplate(prefix), publish, session: projectSession })),
      ),
      createFolder: async () => {
        const folder = await e2eApi.callApi<{ id: string; displayName: string }>({
          request,
          session,
          method: 'POST',
          path: '/api/v1/folders',
          data: { displayName: e2eApi.uniqueName('folder'), projectId: session.projectId },
        });
        cleanup.track({ resource: 'folders', id: folder.id });
        return { id: folder.id, displayName: folder.displayName };
      },
    });
  },
});

export { expect } from '@playwright/test';

function prefixedTemplate(prefix: string): FlowTemplate {
  return { flows: webhookEcho.flows.map((flow) => ({ ...flow, displayName: prefix })) };
}

type FlowsList = {
  newPrefix: () => string;
  seedFlows: (params: { prefix: string; count: number; publish: boolean; session?: E2eSession }) => Promise<SeededFlow[]>;
  createFolder: () => Promise<{ id: string; displayName: string }>;
};
