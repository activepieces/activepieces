import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { closeAuth } from '../../';
import { CloseCRMContactWebhookPayload, CloseCRMLead } from '../common/types';
import crypto from 'crypto';

// Use a namespaced store key
const STORE_KEY = 'close_crm_new_contact_webhook_data';

const verifyWebhookSignature = (
  signatureKey: string,
  timestamp: string,
  rawBody: string,
  signatureHash: string
): boolean => {
  try {
    const hmac = crypto.createHmac('sha256', signatureKey);
    const computedSignature = hmac.update(`${timestamp}${rawBody}`).digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(computedSignature, 'utf8'),
      Buffer.from(signatureHash, 'utf8')
    );
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
};

export const newContactAdded = createTrigger({
  auth: closeAuth,
  name: 'new_contact_added',
  displayName: 'New Contact Added',
  description: 'Triggers when a new contact is created in Close CRM',
  type: TriggerStrategy.WEBHOOK,
  props: {
    include_related: Property.Checkbox({
      displayName: 'Include Related Lead Data',
      description: 'Fetch and include complete lead information with each contact',
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
        events: [
          { object_type: 'contact', action: 'created' },
          { object_type: 'contact', action: 'updated' }, 
        ],
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
        environment, // Store environment for proper cleanup
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
        // Continue with cleanup even if deletion fails
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
        rawBody,
        signatureHash
      )
    ) {
      console.warn('Invalid webhook signature');
      return [];
    }

    const payload = context.payload.body as CloseCRMContactWebhookPayload;

    // Verify this is a contact creation event
    if (
      payload.object_type !== 'contact' ||
      payload.action !== 'created'
    ) {
      return [];
    }

    // Optionally enrich with lead data
    if (context.propsValue.include_related && payload.lead_id) {
      try {
        const lead = await fetchLeadDetails(
          context.auth,
          payload.lead_id
        );
        return [{ ...payload, lead }];
      } catch (error) {
        console.error('Failed to fetch lead details:', error);
        return [payload];
      }
    }

    return [payload];
  },

  sampleData: {
    date_created: "2023-10-27T10:00:00.000Z",
    id: "ev_sample_contact_created",
    action: "created",
    organization_id: "orga_sample_org_id",
    data: {
      id: "cont_sample_contact_id",
      lead_id: "lead_sample_lead_id",
      name: "Jane Doe (Sample Contact)",
      title: "VP of Samples",
      emails: [{ type: 'office', email: 'jane.doe@example.com' }],
      phones: [{ type: 'mobile', phone: '+15551237890' }],
      date_created: "2023-10-27T10:00:00.000Z",
      date_updated: "2023-10-27T10:00:00.000Z"
    },
    object_type: "contact",
    lead_id: "lead_sample_lead_id"
  }
});

// Helper function to fetch lead details
async function fetchLeadDetails(
  auth: { apiKey: string; environment: string },
  leadId: string
) {
  const baseUrl = auth.environment === 'sandbox' 
    ? 'https://api-sandbox.close.com/api/v1' 
    : 'https://api.close.com/api/v1';

  const response = await httpClient.sendRequest<CloseCRMLead>({
    method: HttpMethod.GET,
    url: `${baseUrl}/lead/${leadId}/`,
    headers: {
      'Authorization': `Basic ${Buffer.from(`${auth.apiKey}:`).toString('base64')}`,
      'Accept': 'application/json',
    },
  });

  return response.body;
}