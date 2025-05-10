import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { smartsuiteAuth } from '../auth';
import { smartsuiteCommon } from '../common';
import { SmartSuiteWebhookPayload, WEBHOOK_EVENTS, SMARTSUITE_WEBHOOKS_API_URL, API_ENDPOINTS, ERROR_MESSAGES } from '../common/constants';
import { handleSmartSuiteError } from '../common/utils';

export const newRecord = createTrigger({
  name: 'new_record',
  displayName: 'New Record',
  description: 'Triggers when a new record is created in the specified table',
  auth: smartsuiteAuth,
  props: {
    solution: smartsuiteCommon.solution,
    table: smartsuiteCommon.table,
    includeFields: Property.Array({
      displayName: 'Fields to Include',
      description: 'Fields to include in the webhook payload (leave empty for all fields)',
      required: false,
    }),
    retryOnFailure: Property.Checkbox({
      displayName: 'Retry on Failure',
      description: 'Retry webhook delivery if it fails',
      required: false,
      defaultValue: true,
    }),
    maxRetries: Property.Number({
      displayName: 'Max Retries',
      description: 'Maximum number of retry attempts',
      required: false,
      defaultValue: 3,
      minValue: 1,
      maxValue: 5,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: 'webhook_123',
    type: WEBHOOK_EVENTS.RECORD_CREATED,
    data: {
      record: {
        id: 'record_123',
        title: 'New Record',
        fields: {
          name: 'John Doe',
          email: 'john@example.com',
        },
        created_at: '2024-03-20T10:00:00Z',
        updated_at: '2024-03-20T10:00:00Z',
      },
      solution: {
        id: 'solution_123',
        name: 'My Solution',
      },
      table: {
        id: 'table_123',
        name: 'My Table',
      },
      user: {
        id: 'user_123',
        email: 'admin@example.com',
        name: 'Admin User',
      },
    },
    timestamp: '2024-03-20T10:00:00Z',
  },
  async onEnable({ auth, propsValue }) {
    const { solution, table, includeFields, retryOnFailure, maxRetries } = propsValue;

    try {
      // Validate solution and table
      const solutionResponse = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${SMARTSUITE_API_URL}${API_ENDPOINTS.GET_SOLUTION.replace('{solutionId}', solution)}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth,
        },
      });

      if (!solutionResponse.body) {
        throw new Error(ERROR_MESSAGES.SOLUTION_NOT_FOUND);
      }

      const tableResponse = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${SMARTSUITE_API_URL}${API_ENDPOINTS.GET_APP.replace('{solutionId}', solution).replace('{appId}', table)}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth,
        },
      });

      if (!tableResponse.body) {
        throw new Error(ERROR_MESSAGES.TABLE_NOT_FOUND);
      }

      // Create webhook
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${SMARTSUITE_WEBHOOKS_API_URL}${API_ENDPOINTS.WEBHOOKS}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth,
        },
        body: {
          name: `New Record Webhook - ${table}`,
          solutionId: solution,
          tableIds: [table],
          events: [WEBHOOK_EVENTS.RECORD_CREATED],
          url: propsValue.webhookUrl,
          fields: includeFields,
          retryOnFailure,
          maxRetries,
        },
      });

      if (!response.body?.id) {
        throw new Error(ERROR_MESSAGES.WEBHOOK_CREATION_FAILED);
      }

      return {
        webhookId: response.body.id,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to enable webhook: ${error.message}`);
      }
      throw handleSmartSuiteError(error);
    }
  },
  async onDisable({ auth, propsValue }) {
    const { webhookId } = propsValue;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `${SMARTSUITE_WEBHOOKS_API_URL}${API_ENDPOINTS.WEBHOOK.replace('{webhookId}', webhookId)}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth,
        },
      });

      if (response.status !== 200) {
        throw new Error(ERROR_MESSAGES.WEBHOOK_DELETION_FAILED);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to disable webhook: ${error.message}`);
      }
      throw handleSmartSuiteError(error);
    }
  },
  async run({ payload }) {
    try {
      const webhookPayload = payload as SmartSuiteWebhookPayload;
      
      // Validate webhook payload
      if (!webhookPayload?.data?.record) {
        throw new Error('Invalid webhook payload: missing record data');
      }

      return webhookPayload;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to process webhook: ${error.message}`);
      }
      throw handleSmartSuiteError(error);
    }
  },
}); 