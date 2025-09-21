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

export const newProjects = createTrigger({
  name: 'new_projects',
  displayName: 'New Projects',
  description: 'Triggers when a project is created',
  auth: capsuleAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    id: 12345,
    name: 'Website Redesign Project',
    description: 'Complete redesign of company website',
    status: 'OPEN',
    party: {
      id: 67890,
      name: 'ABC Company'
    },
    opportunity: {
      id: 111,
      name: 'Website Redesign Deal'
    },
    category: 'Development',
    expectedCloseDate: '2023-12-31',
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
          event: 'project.created',
          target_url: webhookUrl
        },
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.access_token
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
          event: 'project.created',
          target_url: webhookUrl
        },
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.access_token
        }
      };

      await httpClient.sendRequest(request);
    } catch (error) {
      console.warn('Failed to unsubscribe from webhook:', error);
    }
  },

  run: async (context) => {
    const payload = context.payload.body as any;

    let projectId: number | null = null;

    if (payload?.project?.id) {
      projectId = payload.project.id;
    } else if (payload?.id && payload?.type === 'project') {
      projectId = payload.id;
    }

    if (projectId) {
      try {
        const projectDetails = await capsuleCommon.apiCall({
          auth: context.auth,
          method: HttpMethod.GET,
          resourceUri: `/projects/${projectId}`
        });

        return [projectDetails.body.project || projectDetails.body];
      } catch (error) {
        console.warn('Failed to fetch project details:', error);
        return [payload];
      }
    }

    return [payload];
  },
});
