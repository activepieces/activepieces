import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { attioAuth } from '../../index';
import { StoredWebhookData, WebhookCreationResponse } from '../common/models';

export const recordUpdatedTrigger = createTrigger({
  name: 'record_updated',
  displayName: 'Record Updated',
  description: 'Triggers when an existing record is updated in Attio (people, companies, deals, etc.)',
  auth: attioAuth,
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    webhook_id: 'b8g9f0e3-2c4d-5f6g-0b9c-8d7e6f5g4h3i',
    events: [
      {
        event_type: 'record.updated',
        id: {
          workspace_id: '3e5f7g9b-0c2d-4f6g-8b0c-2d4f6g8b0c2d',
          object_id: '9g3b5d7f-6e8c-0g2b-4d6f-8g0b2d4f6e8c',
          record_id: '7f9b3d5g-8c0e-2g4b-6d8f-0g2b4d6f8c0e',
          attribute_id: '5d7f9b3g-0e2c-4g6b-8d0f-2g4b6d8f0e2c',
        },
        actor: {
          type: 'workspace-member',
          id: '6f8b0d2g-1e3c-5g7b-9d1f-3g5b7d9f1e3c',
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
                event_type: 'record.updated',
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
        throw new Error(`Failed to enable record updated trigger: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      console.warn(`Failed to disable record updated trigger: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async run(context) {
    if (context.payload.body) {
      return [context.payload.body];
    }
    return [];
  },
});
