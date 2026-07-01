import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { loopquestAuth, baseUrl, authHeaders, LoopQuestAuth } from '../auth';

export const newVerdict = createTrigger({
  auth: loopquestAuth,
  name: 'new_verdict',
  displayName: 'New Verdict',
  description:
    'Fires the moment a human reviewer resolves a task — approve, flag, escalate or timeout. Use it to resume a gated action or act on a monitored review.',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    task_id: '00000000-0000-0000-0000-000000000000',
    external_id: 'order-42',
    module: 'swiper',
    source: 'activepieces',
    verdict: true,
    choice: null,
    reason: null,
    escalated: false,
    timed_out: false,
    reviewed_at: '2026-01-01T00:00:00Z',
  },
  // Auto-subscribe: register this flow's webhook URL with LoopQuest on enable,
  // remove it on disable. Idempotent by URL server-side.
  async onEnable(context) {
    const auth = context.auth as LoopQuestAuth;
    const res = await httpClient.sendRequest<{ id: string }>({
      method: HttpMethod.POST,
      url: `${baseUrl(auth)}/api/v1/hooks`,
      headers: authHeaders(auth),
      body: { url: context.webhookUrl },
    });
    await context.store.put('hookId', res.body.id);
  },
  async onDisable(context) {
    const auth = context.auth as LoopQuestAuth;
    const hookId = await context.store.get<string>('hookId');
    if (hookId) {
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `${baseUrl(auth)}/api/v1/hooks/${hookId}`,
        headers: { authorization: `Bearer ${auth.apiKey}` },
      });
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});
