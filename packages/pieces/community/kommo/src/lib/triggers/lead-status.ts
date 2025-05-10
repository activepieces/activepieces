import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { kommoAuth, getAccessTokenOrThrow, getApiUrl } from '../auth';
import { KOMMO_WEBHOOK_EVENTS } from '../common';

export const leadStatusChangedTrigger = createTrigger({
  name: 'lead_status_changed',
  displayName: 'Lead Status Changed',
  description: 'Triggers when a lead changes its pipeline stage/status',
  props: {
    pipeline_id: Property.Number({
      displayName: 'Pipeline ID',
      description: 'Filter leads by pipeline ID (optional)',
      required: false,
    }),
    status_id: Property.Number({
      displayName: 'Status ID',
      description: 'Filter leads by status ID (optional)',
      required: false,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  auth: kommoAuth,
  sampleData: {
    id: 12345678,
    name: 'Lead Name',
    status_id: 22222222,
    old_status_id: 11111111,
    price: 1000,
    responsible_user_id: 33333333,
    pipeline_id: 44444444,
    created_at: 1726566390,
    updated_at: 1726567767,
    custom_fields_values: [
      {
        field_id: 55555555,
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
            event: KOMMO_WEBHOOK_EVENTS.LEAD_STATUS_CHANGED,
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
    const { status_id } = context.propsValue;

    // Check if the payload contains status changes
    if (payload?.leads?.status && Array.isArray(payload.leads.status)) {
      // If status_id is provided, filter leads by that status
      if (status_id) {
        return payload.leads.status.filter((lead: any) => lead.status_id === status_id);
      }

      return payload.leads.status;
    }

    return [];
  },
});
