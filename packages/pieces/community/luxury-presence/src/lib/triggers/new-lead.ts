import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { luxuryPresenceAuth } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
const LUXURY_PRESENCE_API_BASE = 'https://api.luxurypresence.com/crm/v1';

export const newLead = createTrigger({
  auth: luxuryPresenceAuth,
  name: 'newLead',
  displayName: 'New Lead',
  description: '',
  props: {},
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const apiKey = context.auth.secret_text;

    const url = `${LUXURY_PRESENCE_API_BASE}/webhooks`;

    const resp = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        name: 'ActivePieces New Lead Webhook',
        url: context.webhookUrl,
        events: ['leads'],
      },
    });

    const body = await resp.body;

    await context.store.put('webhook_id', body.id);
  },
  async onDisable(context) {
    const apiKey = context.auth.secret_text;

    const webhookId = (await context.store.get('webhook_id')) as string | null;

    if (webhookId) {
      const deleteUrl = `${LUXURY_PRESENCE_API_BASE}/webhooks/${encodeURIComponent(
        webhookId
      )}`;
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: deleteUrl,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
    }
    await context.store.delete('webhook_id');
  },
  async run(context) {
    const payload = context.payload.body as any;
    if (payload.eventName !== 'leads') {
      return [];
    }
    return [context.payload.body];
  },
});
