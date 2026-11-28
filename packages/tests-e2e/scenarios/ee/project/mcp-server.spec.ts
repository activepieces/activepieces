import { mergeTests } from '@playwright/test';
import { expect, test as accessTest } from '../../../fixtures/access';
import { e2eApi } from '../../../fixtures/api';
import { test as mcpServerTest } from '../../../fixtures/mcp-server';
import webhookEcho from '../../../fixtures/templates/webhook-echo.json';

const test = mergeTests(accessTest, mcpServerTest);

test.describe('MCP server', { tag: '@feature:mcp' }, () => {
  test.describe.configure({ timeout: 120_000 });

  test('a viewer cannot change the tools of the MCP server', async ({ request, viewer, secondProject }) => {
    const path = `/api/v1/projects/${secondProject.id}/mcp-server`;

    const read = await e2eApi.callApiStatus({ request, session: viewer.session, method: 'GET', path });
    const write = await e2eApi.callApiStatus({ request, session: viewer.session, method: 'POST', path, data: { disabledTools: ['ap_delete_flow'] } });

    expect(read).toBe(200);
    expect(write).toBe(403);
  });

  test('a client authorized for one project does not see the flows of another project', async ({ seed, secondProject, mcpServer }) => {
    const other = await seed.flow({ template: webhookEcho, publish: false });
    const own = await seed.flow({ template: webhookEcho, publish: false, session: secondProject.session });
    const { client } = await mcpServer.connect({ scope: 'project', session: secondProject.session });

    const ownFlows = await client.callTool({ name: 'ap_list_flows', arguments: { name: own.flowName } });
    const otherFlows = await client.callTool({ name: 'ap_list_flows', arguments: { name: other.flowName } });

    expect(ownFlows.structuredContent).toEqual({ flows: [expect.objectContaining({ id: own.flowId })], count: 1 });
    expect(otherFlows.structuredContent).toEqual({ flows: [], count: 0 });
  });
});
