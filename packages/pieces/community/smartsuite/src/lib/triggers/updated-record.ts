import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { smartsuiteAuth } from '../auth';
import { smartsuiteCommon } from '../common';
import { SmartSuiteWebhookPayload, WEBHOOK_EVENTS, SMARTSUITE_WEBHOOKS_API_URL, API_ENDPOINTS } from '../common/constants';

export const updatedRecord = createTrigger({
  name: 'updated_record',
  displayName: 'Updated Record',
  description: 'Triggers when a record is updated in the specified table',
  auth: smartsuiteAuth,
  props: {
    solution: smartsuiteCommon.solution,
    table: smartsuiteCommon.table,
    includeFields: Property.Array({
      displayName: 'Fields to Include',
      description: 'Fields to include in the webhook payload (leave empty for all fields)',
      required: false,
    }),
    watchFields: Property.Array({
      displayName: 'Fields to Watch',
      description: 'Only trigger when these fields are updated (leave empty to watch all fields)',
      required: false,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: 'webhook_123',
    type: WEBHOOK_EVENTS.RECORD_UPDATED,
    data: {
      record: {
        id: 'record_123',
        title: 'Updated Record',
        fields: {
          name: 'John Doe',
          email: 'john@example.com',
          status: 'active',
        },
        created_at: '2024-03-20T10:00:00Z',
        updated_at: '2024-03-20T11:00:00Z',
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
    timestamp: '2024-03-20T11:00:00Z',
  },
  async onEnable({ auth, propsValue }) {
    const { solution, table, includeFields, watchFields } = propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${SMARTSUITE_WEBHOOKS_API_URL}${API_ENDPOINTS.WEBHOOKS}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth,
      },
      body: {
        name: `Updated Record Webhook - ${table}`,
        solutionId: solution,
        tableIds: [table],
        events: [WEBHOOK_EVENTS.RECORD_UPDATED],
        url: propsValue.webhookUrl,
        fields: includeFields,
        watchFields: watchFields,
      },
    });

    return {
      webhookId: response.body.id,
    };
  },
  async onDisable({ auth, propsValue }) {
    const { webhookId } = propsValue;

    await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `${SMARTSUITE_WEBHOOKS_API_URL}${API_ENDPOINTS.WEBHOOK.replace('{webhookId}', webhookId)}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth,
      },
    });
  },
  async run({ payload }) {
    const webhookPayload = payload as SmartSuiteWebhookPayload;
    return webhookPayload;
  },
}); 