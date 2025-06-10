import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { attioAuth } from '../../index';
import { StoredWebhookData, WebhookCreationResponse } from '../common/models';

export const listEntryCreatedTrigger = createTrigger({
  name: 'list_entry_created',
  displayName: 'List Entry Created',
  description: 'Triggers when a new entry is added to any list in Attio',
  auth: attioAuth,
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    webhook_id: 'c9h0g1f4-3d5e-6g7h-1c0d-9e8f7g6h5i4j',
    events: [
      {
        event_type: 'list-entry.created',
        id: {
          workspace_id: '4f6g8h0c-1d3e-5g7h-9c1d-3e5g7h9c1d3e',
          list_id: '0h4c6e8g-7f9d-1h3c-5e7g-9h1c3e5g7f9d',
          entry_id: '8g0c4f6h-9e1d-3g5c-7f9h-1c3e5g7f9e1d',
        },
        parent_object_id: '6h8c0f2g-3e5d-7g9c-1f3h-5c7e9g1f3e5d',
        parent_record_id: '2g4c6h8f-5d7e-9g1c-3f5h-7c9e1g3f5d7e'
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
                event_type: 'list-entry.created',
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
        throw new Error(`Failed to enable list entry created trigger: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      console.warn(`Failed to disable list entry created trigger: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async run(context) {
    if (context.payload.body) {
      return [context.payload.body];
    }
    return [];
  },
});
