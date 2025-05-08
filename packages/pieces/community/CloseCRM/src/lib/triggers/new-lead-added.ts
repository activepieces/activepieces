import { TriggerStrategy, createTrigger, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { closeAuth } from '../../';
import { CloseCRMLeadWebhookPayload } from '../common/types';
import crypto from 'crypto';

const STORE_KEY = 'close_crm_new_lead_webhook_data';

export const newLeadCreatedTrigger = createTrigger({
  auth: closeAuth,
  name: 'new_lead_created',
  displayName: 'New Lead Created',
  description: 'Triggers when a new lead is created in Close CRM with configurable filters',
  type: TriggerStrategy.WEBHOOK,
  props: {
    status_filter: Property.StaticDropdown({
      displayName: 'Status Filter',
      description: 'Only trigger for leads with specific status (optional)',
      required: false,
      options: {
        options: [
          { label: 'Any Status', value: '' },
          { label: 'New', value: 'New' },
          { label: 'Contacted', value: 'Contacted' },
          { label: 'Qualified', value: 'Qualified' },
        ],
      },
    }),
    include_contacts: Property.Checkbox({
      displayName: 'Include Full Contact Data',
      description: 'Fetch and include complete contact information with each lead',
      required: false,
      defaultValue: false,
    }),
  },
  async onEnable(context) {
    const { apiKey, environment } = context.auth;
    const baseUrl = environment === 'sandbox' 
      ? 'https://api-sandbox.close.com/api/v1' 
      : 'https://api.close.com/api/v1';

    const webhookConfig = {
      url: context.webhookUrl,
      events: [{ object_type: 'lead', action: 'created' }],
      ...(context.propsValue.status_filter && {
        query: `status_label:"${context.propsValue.status_filter}"`
      }),
    };

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${baseUrl}/webhook/`,
      headers: {
        'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: webhookConfig,
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
        includeContacts: context.propsValue.include_contacts,
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
      includeContacts: boolean;
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

    const payload = context.payload.body as CloseCRMLeadWebhookPayload;

    // Verify this is a lead creation event
    if (
      payload.object_type !== 'lead' ||
      payload.action !== 'created'
    ) {
      return [];
    }

    // Optionally enrich with contact data
    if (triggerData.includeContacts && payload.data.contacts?.length) {
      try {
        const enrichedContacts = await Promise.all(
          payload.data.contacts.map(contactId => 
            fetchContactDetails(context.auth, contactId)
          )
        );
        return [{ ...payload, contacts: enrichedContacts }];
      } catch (error) {
        console.error('Failed to fetch contact details:', error);
        return [payload];
      }
    }

    return [payload];
  },

  sampleData: {
    date_created: "2023-10-27T10:00:00.000Z",
    id: "ev_sample_lead_created",
    action: "created",
    organization_id: "orga_sample_org_id",
    data: {
      id: "lead_sample_lead_id",
      name: "AZ Corporation",
      status_label: "New",
      status_id: "stat_new_status_id",
      contacts: [
        {
          id: "cont_sample_contact_id",
          name: "John Doe",
          emails: [{ email: "john@AZ.com" }],
          phones: [{ phone: "+1234567890" }]
        }
      ],
      date_created: "2025-05-02",
      date_updated: "2025-05-08"
    },
    object_type: "lead"
  }
});

// Helper function to verify webhook signature
function verifyWebhookSignature(
  signatureKey: string,
  timestamp: string,
  rawBody: string,
  signatureHash: string
): boolean {
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
}

// Helper function to fetch contact details
async function fetchContactDetails(
  auth: { apiKey: string; environment: string },
  contactId: string
) {
  const baseUrl = auth.environment === 'sandbox' 
    ? 'https://api-sandbox.close.com/api/v1' 
    : 'https://api.close.com/api/v1';

  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${baseUrl}/contact/${contactId}/`,
    headers: {
      'Authorization': `Basic ${Buffer.from(`${auth.apiKey}:`).toString('base64')}`,
      'Accept': 'application/json',
    },
  });

  return response.body;
}