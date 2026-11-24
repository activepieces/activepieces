import { e2eApi } from './api';
import { test as base } from './index';

export const test = base.extend<PlatformMcpFixtures>({
  platformMcpTools: async ({ request, session }, use) => {
    const readDisabledTools = async () => (await e2eApi.callApi<{ disabledTools: string[] | null }>({ request, session, method: 'GET', path: PLATFORM_MCP_PATH })).disabledTools ?? [];
    const saved = await readDisabledTools();
    await use({ readDisabledTools });
    await e2eApi.callApi({ request, session, method: 'POST', path: PLATFORM_MCP_PATH, data: { disabledTools: saved } });
  },
});

export { expect } from '@playwright/test';

const PLATFORM_MCP_PATH = '/api/v1/mcp-server';

type PlatformMcpFixtures = {
  platformMcpTools: { readDisabledTools: () => Promise<string[]> };
};
