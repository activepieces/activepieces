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

export const newOpportunities = createTrigger({
  name: 'new_opportunities',
  displayName: 'New Opportunities',
  description: 'Triggers when a new opportunity is created',
  auth: capsuleAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    id: 12345,
    name: 'New Sales Opportunity',
    description: 'Potential deal with new client',
    value: {
      amount: 50000,
      currency: 'USD'
    },
    party: {
      id: 67890,
      name: 'Acme Corp'
    },
    milestone: {
      id: 111,
      name: 'Qualified'
    },
    probability: 75,
    expectedCloseDate: '2023-08-27',
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
          event: 'opportunity.created',
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
          event: 'opportunity.created',
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

    let opportunityId: number | null = null;

    if (payload?.opportunity?.id) {
      opportunityId = payload.opportunity.id;
    } else if (payload?.id && payload?.type === 'opportunity') {
      opportunityId = payload.id;
    }

    if (opportunityId) {
      try {
        const opportunityDetails = await capsuleCommon.apiCall({
          auth: context.auth,
          method: HttpMethod.GET,
          resourceUri: `/opportunities/${opportunityId}`
        });

        return [opportunityDetails.body.opportunity || opportunityDetails.body];
      } catch (error) {
        console.warn('Failed to fetch opportunity details:', error);
        return [payload];
      }
    }

    return [payload];
  },
});
