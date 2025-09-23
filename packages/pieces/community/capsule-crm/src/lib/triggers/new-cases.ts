import { capsuleAuth } from '../common/auth';
import {
  HttpMethod,
  HttpRequest,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';
import {
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { capsuleCommon } from '../common/client';

export const newCases = createTrigger({
  name: 'new_cases',
  displayName: 'New Cases',
  description: 'Triggers when a new case is created in Capsule CRM',
  auth: capsuleAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    id: 12345,
    name: 'Customer Support Case',
    description: 'Issue with product setup',
    status: 'OPEN',
    party: {
      id: 67890,
      name: 'John Doe'
    },
    createdAt: '2023-07-27T10:00:00Z',
    updatedAt: '2023-07-27T10:00:00Z'
  },

  onEnable: async (context) => {
    const webhookUrl = context.webhookUrl;

    try {
      const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `${capsuleCommon.baseUrl}/resthooks/subscribe`,
        body: {
          event: 'case.created',
          target_url: webhookUrl
        },
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth
        }
      };

      const response = await httpClient.sendRequest(request);
      if (response.status !== 200 && response.status !== 201) {
        throw new Error(`Failed to subscribe to webhook. Status: ${response.status}`);
      }
    } catch (error) {
      throw new Error(`Failed to setup webhook: ${error}`);
    }
  },

  onDisable: async (context) => {
    const webhookUrl = context.webhookUrl;

    try {
      const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `${capsuleCommon.baseUrl}/resthooks/unsubscribe`,
        body: {
          event: 'case.created',
          target_url: webhookUrl
        },
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth
        }
      };

      await httpClient.sendRequest(request);
    } catch (error) {
      console.warn('Failed to unsubscribe from webhook:', error);
    }
  },

  run: async (context) => {
    const payload = context.payload.body as any;

    let caseId: number | null = null;

    if (payload?.kase?.id) {
      caseId = payload.kase.id;
    } else if (payload?.id && payload?.type === 'kase') {
      caseId = payload.id;
    }

    if (caseId) {
      try {
        const caseDetails = await capsuleCommon.apiCall({
          auth: context.auth,
          method: HttpMethod.GET,
          resourceUri: `/kases/${caseId}`
        });

        return [caseDetails.body.kase || caseDetails.body];
      } catch (error) {
        console.warn('Failed to fetch case details:', error);
        return [payload];
      }
    }

    return [payload];
  },
});
