import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { attioAuth } from '../../index';
import { StoredWebhookData, WebhookCreationResponse } from '../common/models';

// We'll get this from the context in the handler functions
// import { attioAuth } from '../../../index';

export const recordCreatedTrigger = createTrigger({
  auth: attioAuth,
  name: 'record_created',
  displayName: 'Record Created',
  description: 'Triggers when a new record is created in Attio (people, companies, deals, etc.)',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    webhook_id: 'a7f8e9d2-1b3c-4e5f-9a8b-7c6d5e4f3a2b',
    events: [
      {
        event_type: 'record.created',
        id: {
          workspace_id: '2d4e6f8a-9b1c-3e5f-7a9b-1c3e5f7a9b2d',
          object_id: '8f2a4c6e-5d7b-9f1a-3c5e-7f9a1c3e5d7b',
          record_id: '6e8a2c4f-7b9d-1f3a-5c7e-9f1a3c5e7b9d',
        },
        actor: {
          type: 'workspace-member',
          id: '4c6e8a2f-9d1b-3f5a-7c9e-1f3a5c7e9d1b',
        },
      },
    ],
  },

  async onEnable(context) {
    try {
      const response = await makeRequest(
        context.auth,
        HttpMethod.POST,
        '/webhooks',
        {
          data: {
            target_url: context.webhookUrl,
            subscriptions: [
              {
                event_type: 'record.created',
                filter: null,
              }
            ]
          }
        }
      ) as WebhookCreationResponse;

      if (!response?.id?.webhook_id) {
        throw new Error('Failed to create webhook: Invalid response format');
      }

      await context.store.put<StoredWebhookData>('webhookData', {
        webhookId: response.id.webhook_id,
      });
    } catch (error) {
      throw new Error(`Failed to enable record created trigger: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async onDisable(context) {
    try {
      const webhookData = await context.store.get<StoredWebhookData>('webhookData');
      if (webhookData?.webhookId) {
        await makeRequest(
          context.auth,
          HttpMethod.DELETE,
          `/webhooks/${webhookData.webhookId}`,
          undefined
        );
      }
    } catch (error) {
      console.warn(`Failed to disable record created trigger: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async run(context) {
    if (context.payload.body) {
      return [context.payload.body];
    }
    return [];
  },
});
