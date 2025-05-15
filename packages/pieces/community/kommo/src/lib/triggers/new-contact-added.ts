import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { kommoAuth } from '../../index';
import { makeRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const newContactAddedTrigger = createTrigger({
  auth: kommoAuth,
  name: 'new_contact_added',
  displayName: 'New Contact Added',
  description: 'Triggered when a contact is added to Kommo.',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    id: 999999,
    name: 'John Doe',
  },
  async onEnable(context) {
    const { subdomain, apiToken } = context.auth as { subdomain: string; apiToken: string };

    const webhook = await makeRequest(
      { subdomain, apiToken },
      HttpMethod.POST,
      `/webhooks`,
      {
        destination: context.webhookUrl,
        settings: { events: ['contact_added'] }
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
