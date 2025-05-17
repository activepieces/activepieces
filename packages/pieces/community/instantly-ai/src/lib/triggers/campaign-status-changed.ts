import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { instantlyAiAuth } from '../../index';
import { HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';
import { makeRequest } from '../common/client';

export const campaignStatusChangedTrigger = createTrigger({
  auth: instantlyAiAuth,
  name: 'campaign_status_changed',
  displayName: 'Campaign Status Changed',
  description: 'Triggers when a campaign status changes (completed, paused, etc.).\n\nTo use this trigger, manually set up a webhook in Instantly.ai:\n1. Go to Instantly settings\n2. Navigate to Integrations tab and find webhooks\n3. Click "Add Webhook"\n4. Enter the webhook URL provided by ActivePieces\n5. Select the campaign and event type "Campaign Completed"\n6. Click "Add Webhook"',
  props: {
    campaign_id: Property.Dropdown({
      displayName: 'Campaign',
      description: 'The campaign to monitor for status changes',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please authenticate first',
            options: [],
          };
        }

        try {
          const response = await makeRequest({
            endpoint: 'campaigns',
            method: HttpMethod.GET,
            apiKey: auth as string,
            queryParams: {
              limit: 100,
            },
          });

          if (!response || !response.items || !Array.isArray(response.items)) {
            return {
              disabled: true,
              placeholder: 'No campaigns found',
              options: [],
            };
          }

          return {
            options: response.items.map((campaign: any) => {
              return {
                label: campaign.name,
                value: campaign.id,
              };
            }),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Error fetching campaigns',
            options: [],
          };
        }
      },
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    timestamp: "2023-08-22T15:45:30.123Z",
    event_type: "campaign_completed",
    campaign_name: "Product Demo Campaign",
    workspace: "workspace_123456",
    campaign_id: "campaign_789012"
  },
  async onEnable(context) {
    // Store information about the webhook for later disabling
    const webhook = {
      url: context.webhookUrl,
      campaign_id: context.propsValue.campaign_id,
      event_type: "campaign_completed"
    };

    // Store webhook info in the database for disabling later
    await context.store.put('campaign_status_webhook', webhook);
  },
  async onDisable(context) {
    // Nothing to do as Instantly doesn't provide a way to programmatically remove webhooks
    // Users will need to remove webhooks manually from Instantly's integration settings
  },
  async run(context) {
    // Process and return webhook payload
    return [context.payload.body];
  },
});
