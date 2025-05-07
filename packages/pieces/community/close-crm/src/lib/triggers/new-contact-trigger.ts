import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { closeCrmAuth } from '../../index';
import { CLOSE_API_URL } from '../common/constants';
import crypto from 'crypto';

// Use a unique store key for this trigger to avoid collisions if user has multiple triggers
const TRIGGER_DATA_STORE_KEY = 'close_crm_new_contact_trigger_data';

const verifySignature = (signatureKey: string, timestamp: string, rawBody: string, signatureHash: string) => {
  const dataToHmac = timestamp + rawBody;
  const generatedHash = crypto.createHmac('sha256', Buffer.from(signatureKey, 'hex'))
                              .update(dataToHmac)
                              .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(generatedHash), Buffer.from(signatureHash));
};

export const newContactAdded = createTrigger({
  auth: closeCrmAuth,
  name: 'new_contact_added',
  displayName: 'New Contact Added',
  description: 'Triggers when a new contact is linked to a lead.',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const apiKey = context.auth;
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${CLOSE_API_URL}/webhook/`,
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${apiKey}:`).toString('base64'),
        'Content-Type': 'application/json',
      },
      body: {
        url: context.webhookUrl,
        events: [{ object_type: 'contact', action: 'created' }],
      },
    };
    const response = await httpClient.sendRequest<{ id: string, signature_key: string }>(request);
    if (response.status === 200 || response.status === 201) {
      await context.store.put(TRIGGER_DATA_STORE_KEY, {
        webhookId: response.body.id,
        signatureKey: response.body.signature_key
      });
    } else {
      console.error('Failed to create webhook for new contact', response);
      throw new Error(`Failed to create webhook: ${response.status} ${JSON.stringify(response.body)}`);
    }
  },
  async onDisable(context) {
    const apiKey = context.auth;
    const triggerData = await context.store.get<{ webhookId: string, signatureKey: string }>(TRIGGER_DATA_STORE_KEY);
    if (triggerData && triggerData.webhookId) {
      const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: `${CLOSE_API_URL}/webhook/${triggerData.webhookId}`,
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${apiKey}:`).toString('base64'),
        },
      };
      await httpClient.sendRequest(request); // Error handling can be added as in newLeadCreated
    }
    await context.store.delete(TRIGGER_DATA_STORE_KEY);
  },
  async run(context) {
    const triggerData = await context.store.get<{ webhookId: string, signatureKey: string }>(TRIGGER_DATA_STORE_KEY);
    if (!triggerData || !triggerData.signatureKey) {
      return [];
    }
    const signatureHash = context.payload.headers['close-sig-hash'] as string;
    const timestamp = context.payload.headers['close-sig-timestamp'] as string;
    const rawBody = context.payload.rawBody as string;

    if (!signatureHash || !timestamp || rawBody === undefined) {
      return [];
    }
    const isValid = verifySignature(triggerData.signatureKey, timestamp, rawBody, signatureHash);
    if (!isValid) {
      return [];
    }
    const webhookBody = context.payload.body as { event: any, subscription_id: string };
    if (webhookBody && webhookBody.event) {
        if (webhookBody.event.object_type === 'contact' && webhookBody.event.action === 'created') {
            return [webhookBody.event];
        }
    }
    return [];
  },
  async test(context) {
    return [this.sampleData];
  },
  sampleData: {
    date_created: "2023-10-27T10:00:00.000Z",
    meta: {},
    id: "ev_sample_contact_created",
    action: "created",
    date_updated: "2023-10-27T10:00:00.000Z",
    changed_fields: [],
    previous_data: {},
    organization_id: "orga_sample_org_id",
    data: {
      id: "cont_sample_contact_id",
      lead_id: "lead_sample_lead_id",
      name: "Jane Doe (Sample Contact)",
      title: "VP of Samples",
      date_created: "2023-10-27T10:00:00.000Z",
      date_updated: "2023-10-27T10:00:00.000Z",
      emails: [{ type: 'office', email: 'jane.doe@example.com' }],
      phones: [{ type: 'mobile', phone: '+15551237890' }]
    },
    object_id: "cont_sample_contact_id",
    user_id: "user_sample_user_id",
    object_type: "contact",
    lead_id: "lead_sample_lead_id"
  }
});
