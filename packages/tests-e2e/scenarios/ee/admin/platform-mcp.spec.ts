import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { mergeTests } from '@playwright/test';
import { expect, test as accessTest } from '../../../fixtures/access';
import { e2eApi } from '../../../fixtures/api';
import { test as mcpServerTest } from '../../../fixtures/mcp-server';
import { test as platformMcpTest } from '../../../fixtures/platform-mcp';
import { PlatformMcpPage } from '../../../pages/platform-mcp.page';

const test = mergeTests(accessTest, mcpServerTest, platformMcpTest);

test.describe('Platform MCP', { tag: ['@feature:pmcp', '@surface'] }, () => {
  test.describe.configure({ timeout: 120_000 });

  test('an MCP call of the spec shows in MCP activity', async ({ page, request, session, secondProject, mcpServer }) => {
    const marker = e2eApi.uniqueName('MCP activity');
    const { client } = await mcpServer.connect({ scope: 'project', session: secondProject.session });
    const { displayName: projectName } = await e2eApi.callApi<{ displayName: string }>({ request, session, method: 'GET', path: `/api/v1/projects/${secondProject.id}` });

    const result = await client.callTool({
      name: 'ap_run_action',
      arguments: { pieceName: '@activepieces/piece-store', actionName: 'get', input: { key: marker, defaultValue: marker, store_scope: 'COLLECTION' } },
    });
    expect(result.isError).toBeFalsy();
    await expect.poll(async () => (await e2eApi.callApi<{ data: unknown[] }>({ request, session, method: 'GET', path: `/api/v1/mcp-activity?projectIds=${secondProject.id}` })).data)
      .toEqual([expect.objectContaining({ toolName: 'ap_run_action', actionName: 'get', status: 'SUCCEEDED', projectName })]);

    const platformMcpPage = new PlatformMcpPage(page);
    await platformMcpPage.visitActivity({ projectId: secondProject.id });
    const row = platformMcpPage.activityRow(projectName);
    await expect(row).toContainText('Succeeded');
    await row.click();
    await expect(platformMcpPage.activityDetails('Get')).toContainText(marker);
  });

  test('turn off a tool for the platform and the project MCP stops listing it', { tag: '@platform-state' }, async ({ page, mcpServer, platformMcpTools }) => {
    const { client } = await mcpServer.connect({ scope: 'project' });
    const platformMcpPage = new PlatformMcpPage(page);
    expect(await toolNames(client)).toContain(TOOL);

    await platformMcpPage.visitTools();
    await platformMcpPage.turnOffTool({ tier: 'draft', toolName: TOOL });
    await expect.poll(() => platformMcpTools.readDisabledTools()).toContain(TOOL);
    await page.reload();
    await platformMcpPage.openTierTools('draft');

    await expect(platformMcpPage.toolSwitch(TOOL)).not.toBeChecked();
    const listed = await toolNames(client);
    expect(listed).toContain('ap_list_flows');
    expect(listed).not.toContain(TOOL);
  });
});

async function toolNames(client: Client): Promise<string[]> {
  const { tools } = await client.listTools();
  return tools.map((tool) => tool.name);
}

const TOOL = 'ap_rename_flow';
