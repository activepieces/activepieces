import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { AuthenticationType } from '@activepieces/pieces-common';
import { meistertaskAuth } from '../../index';

export const MEISTERTASK_API_URL = 'https://www.meistertask.com/api';

export const meisterTaskCommon = {
  baseUrl: MEISTERTASK_API_URL,

  project: Property.Dropdown({
    displayName: 'Project',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account first',
        };
      }

      try {
        const token = typeof auth === 'string' ? auth : (auth as any).access_token;

        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${MEISTERTASK_API_URL}/projects`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: token,
          },
        });

        return {
          disabled: false,
          options: response.body.map((project: any) => ({
            label: project.name,
            value: project.id,
          })),
        };
      } catch (error) {
        console.error('Error fetching projects:', error);
        return {
          disabled: true,
          options: [],
          placeholder: 'Error loading projects. Please reconnect your account.',
        };
      }
    },
  }),

  section: Property.Dropdown({
    displayName: 'Section',
    required: true,
    refreshers: ['project'],
    options: async ({ auth, project }) => {
      if (!auth || !project) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a project first',
        };
      }

      try {
        const token = typeof auth === 'string' ? auth : (auth as any).access_token;
        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${MEISTERTASK_API_URL}/projects/${project}/sections`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: token,
          },
        });

        return {
          disabled: false,
          options: response.body.map((section: any) => ({
            label: section.name,
            value: section.id,
          })),
        };
      } catch (error) {
        console.error('Error fetching sections:', error);
        return {
          disabled: true,
          options: [],
          placeholder: 'Error loading sections',
        };
      }
    },
  }),

  label: Property.Dropdown({
    displayName: 'Label',
    required: false,
    refreshers: ['project'],
    options: async ({ auth, project }) => {
      if (!auth || !project) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a project first',
        };
      }

      try {
        const token = typeof auth === 'string' ? auth : (auth as any).access_token;

        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${MEISTERTASK_API_URL}/projects/${project}/labels`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: token,
          },
        });

        return {
          disabled: false,
          options: response.body.map((label: any) => ({
            label: label.name,
            value: label.id,
          })),
        };
      } catch (error) {
        console.error('Error fetching labels:', error);
        return {
          disabled: true,
          options: [],
          placeholder: 'Error loading labels',
        };
      }
    },
  }),

  person: Property.Dropdown({
    displayName: 'Person',
    required: false,
    refreshers: ['project'],
    options: async ({ auth, project }) => {
      if (!auth || !project) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a project first',
        };
      }

      try {
        const token = typeof auth === 'string' ? auth : (auth as any).access_token;

        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${MEISTERTASK_API_URL}/projects/${project}/persons`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: token,
          },
        });

        return {
          disabled: false,
          options: response.body.map((person: any) => ({
            label: `${person.firstname} ${person.lastname}`,
            value: person.id,
          })),
        };
      } catch (error) {
        console.error('Error fetching persons:', error);
        return {
          disabled: true,
          options: [],
          placeholder: 'Error loading persons',
        };
      }
    },
  }),
};

export async function makeRequest(
  method: HttpMethod,
  url: string,
  token: string,
  body?: any
) {
  return await httpClient.sendRequest({
    method,
    url: `${MEISTERTASK_API_URL}${url}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token,
    },
    body,
  });
}


export function createWebhookTrigger(config: {
  name: string;
  displayName: string;
  description: string;
  eventType: string;
  sampleData: any;
  requiresProject?: boolean;
}) {
  const props: any = {};

  if (config.requiresProject) {
    props.project = meisterTaskCommon.project;
  }

  return createTrigger({
    auth: meistertaskAuth,
    name: config.name,
    displayName: config.displayName,
    description: config.description,
    props,
    type: TriggerStrategy.WEBHOOK,
    sampleData: config.sampleData,

    async onEnable(context) {
      const webhookUrl = context.webhookUrl;
      const token = typeof context.auth === 'string'
        ? context.auth
        : (context.auth as any).access_token;

      try {
        const requestBody: any = {
          url: webhookUrl,
          event_type: config.eventType,
        };
        if (config.requiresProject && context.propsValue['project']) {
          requestBody.project_id = context.propsValue['project'];
        }

        const response = await httpClient.sendRequest({
          method: HttpMethod.POST,
          url: `${MEISTERTASK_API_URL}/webhooks`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: token,
          },
          body: requestBody,
        });
        if (response.body && response.body.id) {
          await context.store.put('_webhook_id', response.body.id);
          console.log(`Webhook registered successfully: ${response.body.id}`);
        } else {
          console.error('Webhook registration response missing ID:', response.body);
        }
      } catch (error: any) {
        console.error('Failed to register webhook:', error);
      }
    },

    async onDisable(context) {
      const webhookId = await context.store.get('_webhook_id');

      if (!webhookId) {
        console.log('No webhook ID found to delete');
        return;
      }
      try {
        const token = typeof context.auth === 'string'
          ? context.auth
          : (context.auth as any).access_token;

        await httpClient.sendRequest({
          method: HttpMethod.DELETE,
          url: `${MEISTERTASK_API_URL}/webhooks/${webhookId}`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: token,
          },
        });

        console.log(`Webhook ${webhookId} unregistered successfully`);
        await context.store.delete('_webhook_id');
      } catch (error: any) {
        console.error('Failed to unregister webhook:', error);
      }
    },

    async run(context) {
      const payload = context.payload;
      const eventData = payload.body;
      if (!eventData || Object.keys(eventData).length === 0) {
        console.warn('Received empty webhook payload');
        return [];
      }

      return [eventData];
    },
  });
}