import { randomUUID } from 'node:crypto';
import { mergeTests } from '@playwright/test';
import { e2eApi, E2eSession, SeededConnection, SeededFlow } from './api';
import { test as connectionsListTest } from './connections-list';
import { test as embedTest } from './embed';
import connectionStep from './templates/connection-step.json';
import mcpToolEcho from './templates/mcp-tool-echo.json';

export const test = mergeTests(embedTest, connectionsListTest).extend<{ embedConnections: EmbedConnections }>({
  embedConnections: async ({ request, session, seed, cleanup }, use) => {
    const projectSession = (projectId: string): E2eSession => ({ token: session.token, projectId });
    await use({
      projectSession,
      seedPredefinedConnection: async ({ projectId }) => {
        const connection = await e2eApi.callApi<SeededConnection>({
          request,
          session,
          method: 'POST',
          path: '/api/v1/global-connections',
          data: {
            displayName: e2eApi.uniqueName('predefined connection'),
            externalId: `e2e_predefined_${randomUUID().replaceAll('-', '')}`,
            pieceName: ACTIVEPIECES_PIECE,
            type: 'CUSTOM_AUTH',
            value: { type: 'CUSTOM_AUTH', props: { baseApiUrl: 'https://example.com/api/v1', apiKey: randomUUID() } },
            scope: 'PLATFORM',
            projectIds: [projectId],
          },
        });
        cleanup.track({ resource: 'global-connections', id: connection.id });
        return { id: connection.id, externalId: connection.externalId, displayName: connection.displayName };
      },
      seedConnectionStepFlow: ({ projectId }) => seed.flow({ template: connectionStep, publish: false, session: projectSession(projectId) }),
      seedMcpTool: ({ projectId }) => seed.flow({ template: mcpToolEcho, publish: true, session: projectSession(projectId) }),
      readMcpFlowTools: async ({ projectId }) => {
        const mcpServer = await e2eApi.callApi<{ flows: { id: string; version: { displayName: string } }[] }>({
          request,
          session,
          method: 'GET',
          path: `/api/v1/projects/${projectId}/mcp-server`,
        });
        return mcpServer.flows.map((flow) => ({ id: flow.id, name: flow.version.displayName }));
      },
      readFirstStepAuth: async ({ flowId }) => {
        const flow = await e2eApi.callApi<{ version: { trigger: { nextAction: { settings: { input: { auth?: string } } } } } }>({
          request,
          session,
          method: 'GET',
          path: `/api/v1/flows/${flowId}`,
        });
        return flow.version.trigger.nextAction.settings.input.auth;
      },
    });
  },
});

export { expect } from '@playwright/test';

const ACTIVEPIECES_PIECE = '@activepieces/piece-activepieces';

export type EmbedConnections = {
  projectSession: (projectId: string) => E2eSession;
  seedPredefinedConnection: (params: { projectId: string }) => Promise<SeededConnection>;
  seedConnectionStepFlow: (params: { projectId: string }) => Promise<SeededFlow>;
  seedMcpTool: (params: { projectId: string }) => Promise<SeededFlow>;
  readMcpFlowTools: (params: { projectId: string }) => Promise<{ id: string; name: string }[]>;
  readFirstStepAuth: (params: { flowId: string }) => Promise<string | undefined>;
};
