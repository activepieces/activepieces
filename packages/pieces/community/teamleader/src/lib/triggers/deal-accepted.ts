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

export const dealAccepted = createTrigger({
  name: 'deal_accepted',
  displayName: 'Deal Won',
  description: 'Triggers when a deal is won/accepted',
  auth: teamleaderAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    id: '12345678-abcd-1234-5678-1234567890cd',
    title: 'Enterprise Software Deal',
    reference: 'DEA-2025-002',
    status: {
      id: 'won',
      name: 'Won'
    },
    lead: {
      type: 'contact',
      id: '43a6abc5-7fe1-0fa7-942f-85cc4ae5367d'
    },
    department: {
      type: 'department',
      id: '45985439-58ce-02df-2542-9dfe87ee1a39'
    },
    responsible_user: {
      type: 'user',
      id: '12345678-1234-1234-1234-123456789012'
    },
    phase: {
      type: 'dealPhase',
      id: '5296a95e-1870-01af-9f3f-fb3ef990093e'
    },
    estimated_closing_date: '2025-09-30',
    estimated_value: {
      amount: 25000.00,
      currency: 'EUR'
    },
    created_at: '2025-07-25T10:15:30+00:00',
    updated_at: '2025-07-25T15:45:20+00:00',
    closed_at: '2025-07-25T15:45:20+00:00',
    source: {
      type: 'dealSource',
      id: '12345678-abcd-1234-5678-1234567890ab'
    },
    weighted_value: {
      amount: 25000.00,
      currency: 'EUR'
    },
    probability: 100
  },
  onEnable: async (context) => {
    const webhookUrl = context.webhookUrl;
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${teamleaderCommon.baseUrl}/webhooks.register`,
      body: {
        url: webhookUrl,
        types: ['deal.won']
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
        types: ['deal.won']
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
        const dealDetails = await teamleaderCommon.apiCall({
          auth: context.auth,
          method: HttpMethod.POST,
          resourceUri: '/deals.info',
          body: { id: payload.id }
        });
        
        return [dealDetails.body.data];
      } catch (error) {
        return [payload];
      }
    }
    
    return [payload];
  },
});
