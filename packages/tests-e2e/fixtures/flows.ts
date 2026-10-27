import { randomInt, randomUUID } from 'node:crypto';
import { AutomationsPage, BuilderPage } from '../pages';
import { E2E_FLOW_PREFIX } from './api';

async function publishWebhookEchoFlow({ automationsPage, builderPage, flowCleanup }: {
  automationsPage: AutomationsPage;
  builderPage: BuilderPage;
  flowCleanup: { track: (flowId: string) => void };
}): Promise<{ webhookUrl: string }> {
  const flowId = await automationsPage.createFlow();
  flowCleanup.track(flowId);
  await builderPage.nameNewFlow(uniqueFlowName('echo'));
  await builderPage.selectTrigger({ piece: 'Webhook', trigger: 'Catch Webhook' });
  const webhookUrl = await builderPage.webhookUrl();
  await builderPage.testWebhookTrigger({ webhookUrl, value: randomInt(1, 1000000) });
  await builderPage.addStep({ after: 'trigger', piece: 'Webhook', action: 'Return Response' });
  await builderPage.setJsonBody(`{"value": "{{trigger['output']['queryParams']['value']}}"}`);
  await builderPage.publish();
  return { webhookUrl };
}

function uniqueFlowName(label: string) {
  return `${E2E_FLOW_PREFIX}${label} ${randomUUID().slice(0, 8)}`;
}

export const e2eFlows = { publishWebhookEchoFlow, uniqueFlowName };
