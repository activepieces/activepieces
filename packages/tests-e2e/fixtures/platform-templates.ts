import { e2eApi } from './api';
import { test as base } from './index';
import webhookEcho from './templates/webhook-echo.json';
import type { FlowFile } from '../pages/automations.page';

export const test = base.extend<PlatformTemplatesFixtures>({
  flowExport: async ({ request, session, seed }, use) => {
    const { flowId } = await seed.flow({ template: webhookEcho, publish: false });
    const exported = await e2eApi.callApi<unknown>({ request, session, method: 'GET', path: `/api/v1/flows/${flowId}/template` });
    await use({ name: 'webhook-echo.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(exported)) });
  },
});

export { expect } from '@playwright/test';

type PlatformTemplatesFixtures = {
  flowExport: FlowFile;
};
