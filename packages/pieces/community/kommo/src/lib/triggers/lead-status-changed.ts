import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { kommoAuth } from '../../index';
import { makeRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

type KommoLead = {
  id: number;
  status_id: number;
  [key: string]: unknown;
};

export const leadStatusChangedTrigger = createTrigger({
  auth: kommoAuth,
  name: 'lead_status_changed',
  displayName: 'Lead Status Changed',
  description: 'Triggered when a lead changes its pipeline stage/status.',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    id: 123456,
    status_id: 321,
  },
  async onEnable(context) {
    const { subdomain, apiToken } = context.auth as { subdomain: string; apiToken: string };

    const webhook = await makeRequest(
      { subdomain, apiToken },
      HttpMethod.POST,
      `/webhooks`,
      {
        destination: context.webhookUrl,
        settings: { events: ['lead_status_changed'] }
      }
    );

    await context.store.put('webhookId', webhook.id);
  },

  async onDisable(context) {
    const { subdomain, apiToken } = context.auth as { subdomain: string; apiToken: string };
    const webhookId = await context.store.get('webhookId');

    if (webhookId) {
      await makeRequest(
        { subdomain, apiToken },
        HttpMethod.DELETE,
        `/webhooks/${webhookId}`
      );
    }
  },

  async run(context) {
    return [{
      id: Date.now().toString(),
      data: context.payload.body,
    }];
  },
});
