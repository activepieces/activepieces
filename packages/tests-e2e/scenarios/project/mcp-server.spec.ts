import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { mergeTests } from '@playwright/test';
import { test as listResponseTest } from '../../fixtures/list-response';
import { expect, test as mcpServerTest } from '../../fixtures/mcp-server';
import webhookEcho from '../../fixtures/templates/webhook-echo.json';
import { McpServerPage } from '../../pages/mcp-server.page';

const test = mergeTests(mcpServerTest, listResponseTest);

test.describe('MCP server', { tag: '@feature:mcp' }, () => {
  test.describe.configure({ timeout: 120_000 });

  test('expose a flow as a tool and call it from an MCP client', async ({ mcpServer }) => {
    const { toolDescription } = await mcpServer.seedFlowTool();
    const { client } = await mcpServer.connect({ scope: 'project' });
    const value = `echo-${Date.now()}`;

    const { tools } = await client.listTools();
    const flowTools = tools.filter((tool) => tool.description === toolDescription);
    expect(flowTools).toHaveLength(1);
    const result = await client.callTool({ name: flowTools[0].name, arguments: { value } });

    expect(result.isError).toBeFalsy();
    expect(result.content).toEqual([{ type: 'text', text: expect.stringContaining(`"echo": "${value}"`) }]);
  });

  test('consent to an MCP client on the authorize page', async ({ page, session, seed, mcpServer }) => {
    const { flowId, flowName } = await seed.flow({ template: webhookEcho, publish: false });
    const pending = await mcpServer.startAuthorization({ scope: 'platform' });
    await page.route(`${pending.redirectUri}**`, (route) => route.fulfill({ body: 'MCP client callback' }));
    const mcpPage = new McpServerPage(page);

    await mcpPage.authorizeOnConsentPage({ authorizeUrl: pending.authorizeUrl, clientName: pending.clientName });
    await page.waitForURL(`${pending.redirectUri}**`);
    const { client, clientName } = await mcpServer.finishAuthorization({ pending, redirect: new URL(page.url()) });
    await client.callTool({ name: 'ap_set_project_context', arguments: { projectId: session.projectId } });
    const flows = await client.callTool({ name: 'ap_list_flows', arguments: { name: flowName } });

    expect(flows.structuredContent).toEqual({ flows: [expect.objectContaining({ id: flowId })], count: 1 });
    await mcpPage.visitConnections();
    await expect(mcpPage.grantRow(clientName)).toContainText('All projects');
  });

  test('revoke the MCP access and the next call is refused', async ({ page, mcpServer }) => {
    const kept = await mcpServer.connect({ scope: 'project' });
    const revoked = await mcpServer.connect({ scope: 'project' });
    const mcpPage = new McpServerPage(page);
    await mcpPage.visitConnections();
    await expect(mcpPage.grantRow(revoked.clientName)).toBeVisible();

    await mcpPage.revokeGrant(revoked.clientName);
    await page.reload();

    await expect(mcpPage.grantRow(kept.clientName)).toBeVisible();
    await expect(mcpPage.grantRow(revoked.clientName)).toBeHidden();
    await expect(revoked.client.listTools()).rejects.toMatchObject({ code: 401 });
    await expect(kept.client.listTools()).resolves.toMatchObject({ tools: expect.any(Array) });
  });

  test('turn off a tool tier and the client no longer lists its tools', async ({ page, mcpServer, projectMcpTools }) => {
    const { client } = await mcpServer.connect({ scope: 'project' });
    const mcpPage = new McpServerPage(page);
    expect(await toolNames(client)).toEqual(expect.arrayContaining(DELETE_TOOLS));

    await mcpPage.visitTools();
    await mcpPage.turnOffTier('delete');
    await expect.poll(() => projectMcpTools.readDisabledTools()).toEqual(expect.arrayContaining(DELETE_TOOLS));
    await page.reload();

    await expect(mcpPage.tierSwitch('delete')).not.toBeChecked();
    const listed = await toolNames(client);
    expect(listed).toContain('ap_list_flows');
    expect(listed.filter((name) => DELETE_TOOLS.includes(name))).toEqual([]);

    await mcpPage.turnOnDeleteTier();
    await expect.poll(() => toolNames(client)).toEqual(expect.arrayContaining(DELETE_TOOLS));
  });

  test('the Connections tab shows its empty state and its error state', async ({ page, listResponse }) => {
    const mcpPage = new McpServerPage(page);
    const restoreGrants = await listResponse.empty({ resource: 'mcp-oauth/grants' });

    await mcpPage.visitConnections();
    await expect(mcpPage.grantsEmptyState()).toBeVisible();

    await restoreGrants();
    await listResponse.fail({ resource: 'mcp-oauth/grants' });
    await page.reload();
    await expect(mcpPage.errorState()).toBeVisible({ timeout: listResponse.ERROR_STATE_TIMEOUT_MS });
  });
});

async function toolNames(client: Client): Promise<string[]> {
  const { tools } = await client.listTools();
  return tools.map((tool) => tool.name);
}

const DELETE_TOOLS = ['ap_delete_flow', 'ap_delete_table', 'ap_delete_records', 'ap_manage_fields'];
