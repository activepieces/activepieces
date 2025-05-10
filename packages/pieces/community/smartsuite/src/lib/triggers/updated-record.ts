import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { smartsuiteAuth } from '../auth';
import { smartsuiteCommon } from '../common';
import { SMARTSUITE_API_URL, SMARTSUITE_WEBHOOKS_API_URL, API_ENDPOINTS, WEBHOOK_EVENTS } from '../common/constants';

export const updatedRecord = createTrigger({
  name: 'updated_record',
  displayName: 'Updated Record',
  description: 'Triggers when a record is updated in the specified table',
  type: TriggerStrategy.WEBHOOK,
  auth: smartsuiteAuth,
  props: {
    solution: smartsuiteCommon.solution,
    table: smartsuiteCommon.table,
  },

  async onEnable(context) {
    const { solution, table } = context.propsValue;

    // Create a webhook for updated records
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${SMARTSUITE_WEBHOOKS_API_URL}${API_ENDPOINTS.CREATE_WEBHOOK}`,
      body: {
        webhook: {
          filter: {
            applications: {
              application_ids: [table]
            }
          },
          kinds: [WEBHOOK_EVENTS.RECORD_UPDATED],
          locator: {
            account_id: '', // This will be filled by SmartSuite based on the API key
            solution_id: solution
          },
          notification_status: {
            enabled: {
              url: context.webhookUrl
            }
          }
        }
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Store the webhook ID for later use
    await context.store.put('webhookId', response.body.webhooks[0].webhook_id);
  },

  async onDisable(context) {
    const webhookId = await context.store.get('webhookId');

    if (webhookId) {
      // Delete the webhook
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${SMARTSUITE_WEBHOOKS_API_URL}${API_ENDPOINTS.DELETE_WEBHOOK}`,
        body: {
          webhook_id: webhookId
        },
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth,
        },
      });
    }
  },

  async run(context) {
    // When a webhook is triggered, SmartSuite sends a notification with minimal info
    // We need to fetch the actual record data
    const webhookPayload = context.payload.body as {
      webhookId: string;
      locator: {
        accountId: string;
        solutionId: string;
      };
    };

    if (!webhookPayload || !webhookPayload.webhookId || !webhookPayload.locator) {
      return [];
    }

    // Get the webhook events
    const eventsResponse = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${SMARTSUITE_WEBHOOKS_API_URL}${API_ENDPOINTS.LIST_EVENTS}`,
      body: {
        webhook_id: webhookPayload.webhookId,
        limit: 10 // Get the latest events
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
    });

    const events = eventsResponse.body.events || [];

    // Process each event to get the record data
    const recordPromises = events.map(async (event: any) => {
      if (event.kind === WEBHOOK_EVENTS.RECORD_UPDATED && event.locator.application_id) {
        // Get the record data
        try {
          const recordResponse = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${SMARTSUITE_API_URL}${API_ENDPOINTS.GET_RECORD
              .replace('{solutionId}', webhookPayload.locator.solutionId)
              .replace('{appId}', event.locator.application_id)
              .replace('{recordId}', event.locator.record_id)}`,
            authentication: {
              type: AuthenticationType.BEARER_TOKEN,
              token: context.auth,
            },
          });

          return recordResponse.body;
        } catch (error) {
          console.error('Error fetching record:', error);
          return null;
        }
      }
      return null;
    });

    const records = await Promise.all(recordPromises);
    return records.filter(record => record !== null);
  },

  sampleData: {
    id: '12345',
    title: 'Sample Record',
    fields: {
      field1: 'Value 1',
      field2: 'Value 2'
    },
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z'
  }
});
