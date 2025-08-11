import { teamleaderAuth } from '../common/auth';
import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import {
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { teamleaderCommon } from '../common/client';

export const newCompany = createTrigger({
  name: 'new_company',
  displayName: 'New Company',
  description: 'Triggers when a new company is created',
  auth: teamleaderAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    id: '12345678-abcd-1234-5678-1234567890ef',
    name: 'Acme Corporation',
    business_type: {
      id: 'be123456-1234-1234-1234-123456789012',
      name: 'Limited Company'
    },
    vat_number: 'BE0123456789',
    national_identification_number: '123456789',
    emails: [
      {
        type: 'invoicing',
        email: 'billing@acme.com'
      }
    ],
    telephones: [
      {
        type: 'phone',
        number: '+32 2 123 45 67'
      }
    ],
    website: 'https://www.acme.com',
    addresses: [
      {
        type: 'invoicing',
        address: {
          line_1: '123 Business Street',
          postal_code: '1000',
          city: 'Brussels',
          country: 'BE'
        }
      }
    ],
    iban: 'BE71 0961 2345 6769',
    bic: 'GKCCBEBB',
    language: 'en',
    responsible_user: {
      type: 'user',
      id: '12345678-1234-1234-1234-123456789012'
    },
    tags: ['prospect', 'enterprise'],
    remarks: 'Important enterprise client',
    created_at: '2023-07-27T10:00:00+00:00',
    updated_at: '2023-07-27T10:00:00+00:00'
  },
  onEnable: async (context) => {
    const webhookUrl = context.webhookUrl;
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${teamleaderCommon.baseUrl}/webhooks.register`,
      body: {
        url: webhookUrl,
        types: ['company.added']
      },
      headers: {
        Authorization: `Bearer ${context.auth.access_token}`,
        'Content-Type': 'application/json',
      },
    };

    const { status } = await httpClient.sendRequest(request);
    if (status !== 204) {
      throw new Error(`Failed to register webhook. Status: ${status}`);
    }
  },
  onDisable: async (context) => {
    const webhookUrl = context.webhookUrl;
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${teamleaderCommon.baseUrl}/webhooks.unregister`,
      body: {
        url: webhookUrl,
        types: ['company.added']
      },
      headers: {
        Authorization: `Bearer ${context.auth.access_token}`,
        'Content-Type': 'application/json',
      },
    };

    try {
      await httpClient.sendRequest(request);
    } catch (error) {
      console.warn('Failed to unregister webhook:', error);
    }
  },
  run: async (context) => {
    const payload = context.payload.body as any;
    
    if (payload?.id) {
      try {
        const companyDetails = await teamleaderCommon.apiCall({
          auth: context.auth,
          method: HttpMethod.POST,
          resourceUri: '/companies.info',
          body: { id: payload.id }
        });
        
        return [companyDetails.body.data];
      } catch (error) {
        return [payload];
      }
    }
    
    return [payload];
  },
});
