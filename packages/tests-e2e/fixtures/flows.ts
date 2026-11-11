import { randomInt, randomUUID } from 'node:crypto';
import type { Page } from '@playwright/test';
import { AutomationsPage } from '../pages/automations.page';
import { BuilderPage } from '../pages/builder.page';
import { E2E_PREFIX } from './api';
import type { Cleanup } from './index';

async function publishWebhookEchoFlow({ page, cleanup }: { page: Page; cleanup: Cleanup }): Promise<{ flowId: string; flowName: string; webhookUrl: string }> {
  const builderPage = new BuilderPage(page);
  const flowId = await new AutomationsPage(page).createFlow();
  cleanup.track({ resource: 'flows', id: flowId });
  const flowName = uniqueName('echo');
  await builderPage.nameNewFlow(flowName);
  await builderPage.selectTrigger({ piece: 'Webhook', trigger: 'Catch Webhook' });
  const webhookUrl = await builderPage.webhookUrl();
  await builderPage.testWebhookTrigger({ webhookUrl, value: randomInt(1, 1000000) });
  await builderPage.addStep({ after: 'trigger', piece: 'Webhook', action: 'Return Response' });
  await builderPage.setJsonBody(`{"value": "{{trigger['output']['queryParams']['value']}}"}`);
  await builderPage.publish();
  return { flowId, flowName, webhookUrl };
}

function uniqueName(label: string) {
  return `${E2E_PREFIX}${label} ${randomUUID().slice(0, 8)}`;
}

export const e2eFlows = { publishWebhookEchoFlow, uniqueName };
