import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { kommoAuth, getAccessTokenOrThrow, getApiUrl } from '../auth';
import { KOMMO_WEBHOOK_EVENTS } from '../common';

export const newLeadTrigger = createTrigger({
  name: 'new_lead',
  displayName: 'New Lead Created',
  description: 'Triggers when a new lead is created in Kommo',
  props: {
    pipeline_id: Property.Number({
      displayName: 'Pipeline ID',
      description: 'Filter leads by pipeline ID (optional)',
      required: false,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  auth: kommoAuth,
  sampleData: {
    id: 12345678,
    name: 'New Lead',
    price: 1000,
    responsible_user_id: 11111111,
    status_id: 22222222,
    pipeline_id: 33333333,
    created_at: 1726566390,
    updated_at: 1726566390,
    custom_fields_values: [
      {
        field_id: 44444444,
        field_name: 'Source',
        values: [{ value: 'Website' }],
      },
    ],
  },
  async onEnable(context) {
    const { pipeline_id } = context.propsValue;
    const accessToken = getAccessTokenOrThrow(context.auth);

    // Create webhook subscription
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: getApiUrl(context.auth, 'webhooks'),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        destination: context.webhookUrl,
        settings: [
          {
            entity_type: 'lead',
            event: KOMMO_WEBHOOK_EVENTS.LEAD_ADDED,
            pipeline_id: pipeline_id || null,
          },
        ],
      },
    });

    // Store webhook ID for later deletion
    await context.store.put('webhook_id', response.body.id);
  },

  async onDisable(context) {
    const accessToken = getAccessTokenOrThrow(context.auth);
    const webhookId = await context.store.get('webhook_id');

    if (webhookId) {
      // Delete webhook subscription
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: getApiUrl(context.auth, `webhooks/${webhookId}`),
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    }
  },

  async run(context) {
    const payload = context.payload.body as Record<string, any>;

    // Check if the payload contains new leads
    if (payload?.leads?.add && Array.isArray(payload.leads.add)) {
      return payload.leads.add;
    }

    return [];
  },
});
