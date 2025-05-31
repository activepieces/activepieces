import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { attioAuth } from '../../index';
import { StoredWebhookData, WebhookCreationResponse } from '../common/models';

export const listEntryUpdatedTrigger = createTrigger({
  name: 'list_entry_updated',
  displayName: 'List Entry Updated',
  description: 'Triggers when an existing entry in any list is updated in Attio',
  auth: attioAuth,
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    webhook_id: 'd0i1h2g5-4e6f-7h8i-2d1e-0f9g8h7i6j5k',
    events: [
      {
        event_type: 'list-entry.updated',
        id: {
          workspace_id: '5g7h9i1d-2e4f-6h8i-0d2e-4f6h8i0d2e4f',
          list_id: '1i5d7f9h-8g0e-2i4d-6f8h-0i2d4f6h8g0e',
          entry_id: '9h1d5g7i-0f2e-4h6d-8g0i-2d4f6h8g0f2e',
          attribute_id: '7i9d1g5h-2f4e-6i8d-0g2h-4d6f8i0g2f4e',
        },
        parent_object_id: '3h5d7i9g-6f8e-0h2d-4g6i-8h0d2g4i6f8e',
        parent_record_id: '9g1d3h5i-4f6e-8g0d-2h4i-6g8d0h2i4f6e',
        actor: {
          type: 'workspace-member',
          id: '5i7d9g1h-0f2e-4i6d-8g0h-2i4d6g8h0f2e',
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
                event_type: 'list-entry.updated',
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
        throw new Error(`Failed to enable list entry updated trigger: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      console.warn(`Failed to disable list entry updated trigger: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async run(context) {
    if (context.payload.body) {
      return [context.payload.body];
    }
    return [];
  },
});
