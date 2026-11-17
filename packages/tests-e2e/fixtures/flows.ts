import { e2eApi } from './api';
import type { Seed } from './index';
import webhookEcho from './templates/webhook-echo.json';

async function publishWebhookEchoFlow({ seed }: { seed: Seed }) {
  return seed.flow({ template: webhookEcho, publish: true });
}

export const e2eFlows = { publishWebhookEchoFlow, uniqueName: e2eApi.uniqueName };
