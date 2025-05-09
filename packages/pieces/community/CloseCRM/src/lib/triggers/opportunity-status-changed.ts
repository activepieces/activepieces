import { TriggerStrategy, createTrigger, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { closeAuth } from '../../';
import { CloseCRMOpportunityWebhookPayload } from '../common/types';
import crypto from 'crypto';

const STORE_KEY = 'close_crm_opportunity_status_webhook_data';

export const opportunityStatusChanged = createTrigger({
  auth: closeAuth,
  name: 'opportunity_status_changed',
  displayName: 'Opportunity Status Changed',
  description: 'Triggers when an opportunity status is updated with configurable filters',
  type: TriggerStrategy.WEBHOOK,
  props: {
    status_types: Property.StaticDropdown({
      displayName: 'Filter Status Types',
      description: 'Only trigger for specific status types (leave empty for all)',
      required: false,
      options: {
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Won', value: 'won' },
          { label: 'Lost', value: 'lost' },
          { label: 'Archived', value: 'archived' },
        ],
      },
    }),
    min_value: Property.Number({
      displayName: 'Minimum Opportunity Value',
      description: 'Only trigger for opportunities with value greater than this amount',
      required: false,
    }),
    include_previous_status: Property.Checkbox({
      displayName: 'Include Previous Status',
      description: 'Include previous status data in the payload',
      required: false,
      defaultValue: false,
    }),
  },
  async onEnable(context) {
    const { apiKey, environment } = context.auth;
    const baseUrl = environment === 'sandbox' 
      ? 'https://api-sandbox.close.com/api/v1' 
      : 'https://api.close.com/api/v1';

    const request: HttpRequest<{
      url: string;
      events: Array<{ object_type: string; action: string }>;
    }> = {
      method: HttpMethod.POST,
      url: `${baseUrl}/webhook/`,
      headers: {
        'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: {
        url: context.webhookUrl,
        events: [{ object_type: 'opportunity', action: 'updated' }],
      },
    };

    const response = await httpClient.sendRequest<{
      id: string;
      signature_key: string;
    }>(request);

    if (response.status >= 200 && response.status < 300) {
      await context.store.put(STORE_KEY, {
        webhookId: response.body.id,
        signatureKey: response.body.signature_key,
        environment,
      });
    } else {
      throw new Error(
        `Failed to create webhook: ${response.status} ${JSON.stringify(response.body)}`
      );
    }
  },

  async onDisable(context) {
    const triggerData = await context.store.get<{
      webhookId: string;
      signatureKey: string;
      environment: string;
    }>(STORE_KEY);

    if (triggerData?.webhookId) {
      const baseUrl = triggerData.environment === 'sandbox' 
        ? 'https://api-sandbox.close.com/api/v1' 
        : 'https://api.close.com/api/v1';

      const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: `${baseUrl}/webhook/${triggerData.webhookId}`,
        headers: {
          'Authorization': `Basic ${Buffer.from(`${context.auth.apiKey}:`).toString('base64')}`,
        },
      };

      try {
        await httpClient.sendRequest(request);
      } catch (error) {
        console.error('Failed to delete webhook:', error);
      }
    }

    await context.store.delete(STORE_KEY);
  },

  async run(context) {
    const triggerData = await context.store.get<{
      webhookId: string;
      signatureKey: string;
    }>(STORE_KEY);

    // Validate webhook signature
    const signatureHash = context.payload.headers['close-sig-hash'];
    const timestamp = context.payload.headers['close-sig-timestamp'];
    const rawBody = context.payload.rawBody;

    if (
      !triggerData?.signatureKey ||
      !signatureHash ||
      !timestamp ||
      rawBody === undefined
    ) {
      return [];
    }

    if (
      !verifyWebhookSignature(
        triggerData.signatureKey,
        timestamp,
        signatureHash
      )
    ) {
      console.warn('Invalid webhook signature');
      return [];
    }

    const payload = context.payload.body as CloseCRMOpportunityWebhookPayload;

    // Verify this is an opportunity update event with status change
    if (
      payload.object_type !== 'opportunity' ||
      payload.action !== 'updated' 
    ) {
      return [];
    }

    // Apply filters
    if (
      context.propsValue.status_types?.length &&
      !context.propsValue.status_types.includes(payload.data.status_type)
    ) {
      return [];
    }

    if (
      context.propsValue.min_value &&
      (!payload.data.value || payload.data.value < context.propsValue.min_value)
    ) {
      return [];
    }

    // Optionally remove previous status data
    if (!context.propsValue.include_previous_status) {
      const { previous_data, ...filteredPayload } = payload;
      return [filteredPayload];
    }

    return [payload];
  },

  sampleData: {
    date_created: "2025-05-08",
    id: "ev_sample_opportunity_updated",
    action: "updated",
    organization_id: "orga_sample_org_id",
    changed_fields: ["status_id", "status_label", "status_type"],
    previous_data: {
      status_type: "active",
      status_label: "In Progress",
      status_id: "stat_previous_status_id"
    },
    data: {
      id: "oppo_sample_opportunity_id",
      lead_id: "lead_sample_lead_id",
      status_type: "won",
      status_label: "Closed Won",
      status_id: "stat_new_status_id",
      value: 10000,
      value_currency: "USD",
      value_formatted: "$10,000",
      contact_id: "cont_sample_contact_id",
      contact_name: "John Doe",
      lead_name: "AZ Corp",
      date_won: "2025-05-08",
      confidence: 100,
      date_created: "2025-05-01",
      date_updated: "2025-05-08"
    },
    object_type: "opportunity",
    lead_id: "lead_sample_lead_id"
  }
});

// Helper function to verify webhook signature
function verifyWebhookSignature(
  signatureKey: string,
  timestamp: string,
  signatureHash: string
): boolean {
  try {
    const hmac = crypto.createHmac('sha256', signatureKey);
    const computedSignature = hmac.update(`${timestamp}`).digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(computedSignature, 'utf8'),
      Buffer.from(signatureHash, 'utf8')
    );
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

// Helper function to check if status was actually changed
function isStatusChange(payload: CloseCRMOpportunityWebhookPayload): boolean {
  const statusFields = ['status_id', 'status_label', 'status_type'];
  return payload.changed_fields?.some(field => statusFields.includes(field)) ?? false;
}