import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { instantlyAiAuth } from '../../index';
import { HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';
import { makeRequest } from '../common/client';

interface InstantlyLeadWebhookPayload {
  timestamp: string;
  event_type: string;
  campaign_name: string;
  workspace: string;
  campaign_id: string;
  lead_email: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  website?: string;
  phone?: string;
  [key: string]: any;
}

export const newLeadAddedTrigger = createTrigger({
  auth: instantlyAiAuth,
  name: 'new_lead_added',
  displayName: 'New Lead Added',
  description: 'Triggers when a new lead is added to a campaign.\n\nTo use this trigger, manually set up a webhook in Instantly.ai:\n1. Go to Instantly settings\n2. Navigate to Integrations tab and find webhooks\n3. Click "Add Webhook"\n4. Enter the webhook URL provided by ActivePieces\n5. Select the campaign and event type "Email Sent"\n6. Click "Add Webhook"',
  props: {
    campaign_id: Property.Dropdown({
      displayName: 'Campaign',
      description: 'The campaign to monitor for new leads',
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
    event_type: "email_sent",
    campaign_name: "Product Demo Campaign",
    workspace: "workspace_123456",
    campaign_id: "campaign_789012",
    lead_email: "contact@example.com",
    firstName: "John",
    lastName: "Doe",
    companyName: "Example Inc",
    website: "example.com",
    phone: "+1234567890"
  },
  async onEnable(context) {
    // Store information about the webhook for later reference
    // Note: The webhook must be manually created in Instantly.ai dashboard
    const webhook = {
      url: context.webhookUrl,
      campaign_id: context.propsValue.campaign_id,
      event_type: "email_sent"  // Email sent is a good indicator of a new lead being added
    };

    // Store webhook info in the database
    await context.store.put('new_lead_webhook', webhook);
  },
  async onDisable(context) {
    // Nothing to do as Instantly doesn't provide a way to programmatically remove webhooks
    // Users will need to remove webhooks manually from Instantly's integration settings
  },
  async run(context) {
    // Process and return webhook payload
    const payload = context.payload.body as InstantlyLeadWebhookPayload;

    // Verify this is a lead-related event
    if (payload.event_type === "email_sent" &&
        payload.campaign_id === context.propsValue.campaign_id) {
      // Extract lead information from the payload
      const leadData = {
        id: payload.lead_email,
        email: payload.lead_email,
        first_name: payload.firstName,
        last_name: payload.lastName,
        created_at: payload.timestamp,
        company: payload.companyName,
        website: payload.website,
        phone: payload.phone
      };

      // Add remaining payload fields except for campaign_id which we already extracted
      const { campaign_id, ...otherFields } = payload;

      return [{
        ...leadData,
        ...otherFields,
        campaign_id // Add campaign_id at the end to ensure it's the correct one
      }];
    }

    // Don't trigger for other event types
    return [];
  },
});
