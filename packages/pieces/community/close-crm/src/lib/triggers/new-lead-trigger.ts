import {TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { closeCrmAuth } from '../../index';
import { CLOSE_API_URL } from '../common/constants';
import crypto from 'crypto';

const TRIGGER_DATA_STORE_KEY = 'close_crm_trigger_data';

const verifySignature = (signatureKey: string, timestamp: string, rawBody: string, signatureHash: string) => {
  const dataToHmac = timestamp + rawBody;
  const generatedHash = crypto.createHmac('sha256', Buffer.from(signatureKey, 'hex'))
                              .update(dataToHmac)
                              .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(generatedHash), Buffer.from(signatureHash));
};

export const newLeadCreated = createTrigger({
  auth: closeCrmAuth,
  name: 'new_lead_created',
  displayName: 'New Lead Created',
  description: 'Triggers when a new lead is added to Close CRM.',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${CLOSE_API_URL}/webhook/`,
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${context.auth.username}:`).toString('base64'),
        'Content-Type': 'application/json',
      },
      body: {
        url: context.webhookUrl,
        events: [{ object_type: 'lead', action: 'created' }],
      },
    };
    const response = await httpClient.sendRequest<{ id: string, signature_key: string }>(request);
    if (response.status === 200 || response.status === 201) {
      await context.store.put(TRIGGER_DATA_STORE_KEY, {
        webhookId: response.body.id,
        signatureKey: response.body.signature_key
      });
    } else {
      console.error('Failed to create webhook', response);
      throw new Error(`Failed to create webhook: ${response.status} ${JSON.stringify(response.body)}`);
    }
  },
  async onDisable(context) {
    const triggerData = await context.store.get<{ webhookId: string, signatureKey: string }>(TRIGGER_DATA_STORE_KEY);
    if (triggerData && triggerData.webhookId) {
      const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: `${CLOSE_API_URL}/webhook/${triggerData.webhookId}`,
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${context.auth.username}:`).toString('base64'),
        },
      };
      const response = await httpClient.sendRequest(request);
      if (response.status !== 200 && response.status !== 204) {
        console.warn(`Failed to delete webhook ${triggerData.webhookId}:`, response);
        // Not throwing an error here to allow disabling even if Close API fails to delete
      }
    }
    await context.store.delete(TRIGGER_DATA_STORE_KEY);
  },
  async run(context) {
    const triggerData = await context.store.get<{ webhookId: string, signatureKey: string }>(TRIGGER_DATA_STORE_KEY);
    if (!triggerData || !triggerData.signatureKey) {
      console.warn('Signature key not found in store. Cannot verify webhook.');
      // Depending on policy, might return empty or throw error
      return [];
    }

    const signatureHash = context.payload.headers['close-sig-hash'] as string;
    const timestamp = context.payload.headers['close-sig-timestamp'] as string;
    const rawBody = context.payload.rawBody as string;

    if (!signatureHash || !timestamp || rawBody === undefined) {
      console.warn('Missing signature headers or body for webhook verification.');
      return [];
    }

    const isValid = verifySignature(triggerData.signatureKey, timestamp, rawBody, signatureHash);

    if (!isValid) {
      console.warn('Webhook signature mismatch. Potential tampering or misconfiguration.');
      return [];
    }
    // The actual event data we want is nested under the 'event' key in the body
    const webhookBody = context.payload.body as { event: any, subscription_id: string };
    if (webhookBody && webhookBody.event) {
        // Ensure the event matches what we subscribed to (optional, but good practice)
        if (webhookBody.event.object_type === 'lead' && webhookBody.event.action === 'created') {
            return [webhookBody.event];
        }
    }
    return [];
  },
  async test(context) {
    // For webhook triggers, test usually just returns sample data.
    // It can optionally send a request to the API to confirm auth, but not strictly necessary for webhooks.
    return [this.sampleData];
  },
  sampleData: {
    // This is the 'event' object from the example webhook data
    date_created: "2019-01-15T12:41:24.496000", // Assuming a new lead uses current time, adjusted for sample
    meta: {},
    id: "ev_sample_lead_created",
    action: "created",
    date_updated: "2019-01-15T12:41:24.496000",
    changed_fields: [], // For 'created' event, changed_fields might be empty or list all fields
    previous_data: {},
    organization_id: "orga_XbVPx5fFbKlYTz9PW5Ih1XDhViV10YihIaEgMEb6fVW",
    data: {
      // Example fields for a newly created lead - adapt as needed from Lead object structure
      // Using a simplified version here for brevity. Actual webhook will contain more fields.
      id: "lead_newly_created_sample",
      name: "New Sample Lead Inc.",
      display_name: "New Sample Lead Inc.",
      status_label: "Potential",
      status_id: "stat_potential_default",
      date_created: "2019-01-15T12:41:24.496000+00:00",
      date_updated: "2019-01-15T12:41:24.496000+00:00",
      contacts: [],
      opportunities: [],
    },
    object_id: "lead_newly_created_sample",
    user_id: "user_N6KhMpzHRCYQHdn4gRNIFNN5JExnsrprKA6ekxM63XA", // User who performed action
    object_type: "lead",
    lead_id: "lead_newly_created_sample"
  }
});
