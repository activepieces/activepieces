import { randomInt, randomUUID } from 'node:crypto';
import { AutomationsPage, BuilderPage } from '../pages';
import { E2E_PREFIX } from './api';

async function publishWebhookEchoFlow({ automationsPage, builderPage, flowCleanup, responseBody = ECHO_QUERY_VALUE }: {
  automationsPage: AutomationsPage;
  builderPage: BuilderPage;
  flowCleanup: { track: (flowId: string) => void };
  responseBody?: string;
}): Promise<{ webhookUrl: string }> {
  const flowId = await automationsPage.createFlow();
  flowCleanup.track(flowId);
  await builderPage.nameNewFlow(uniqueName('echo'));
  await builderPage.selectTrigger({ piece: 'Webhook', trigger: 'Catch Webhook' });
  const webhookUrl = await builderPage.webhookUrl();
  await builderPage.testWebhookTrigger({ webhookUrl, value: randomInt(1, 1000000) });
  await builderPage.addStep({ after: 'trigger', piece: 'Webhook', action: 'Return Response' });
  await builderPage.setJsonBody(responseBody);
  await builderPage.publish();
  return { webhookUrl };
}

function uniqueName(label: string) {
  return `${E2E_PREFIX}${label} ${randomUUID().slice(0, 8)}`;
}

const ECHO_QUERY_VALUE = `{"value": "{{trigger['output']['queryParams']['value']}}"}`;

export const e2eFlows = { publishWebhookEchoFlow, uniqueName };
