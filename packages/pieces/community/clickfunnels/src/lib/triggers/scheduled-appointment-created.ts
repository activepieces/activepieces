import { clickfunnelsAuth } from '../common/auth';
import { clickfunnelsCommon } from '../common/client';
import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import {
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';

export const scheduledAppointmentCreated = createTrigger({
  name: 'scheduled_appointment_created',
  displayName: 'Scheduled Appointment Event Created',
  description: 'Fires when a scheduled appointment event is created',
  auth: clickfunnelsAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    id: 2,
    public_id: "pSmykl",
    workspace_id: 42000,
    start_on: "2025-07-30T20:00:00.000Z",
    end_on: "2025-07-30T20:30:00.000Z",
    status: "scheduled",
    max_invitees: 1,
    order_id: null,
    comments: "This is an example scheduled event for testing purposes.",
    tzid: "America/Los_Angeles",
    created_at: "2025-07-02T20:25:33.994Z",
    updated_at: "2025-07-09T20:25:33.994Z",
    event_type: {
      name: "30 Minute Meeting"
    },
    primary_contact: {
      id: 41,
      public_id: "GmtoZj",
      email_address: "test-5679688decb1276eabf2@example.com",
      first_name: "Mike",
      last_name: "Fisher",
      phone_number: "211.383.0524 x486"
    }
  },

  onEnable: async (context) => {
    const subdomain = clickfunnelsCommon.extractSubdomain(context.auth);
    const webhookUrl = context.webhookUrl;
    
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://${subdomain}.myclickfunnels.com/api/v2/webhooks/outgoing/endpoints`,
      body: {
        endpoint: {
          name: 'Activepieces Scheduled Appointment Created',
          url: webhookUrl,
          event_type_ids: ['appointments.scheduled_event.created']
        }
      },
      headers: {
        Authorization: `Bearer ${context.auth.access_token}`,
        'Content-Type': 'application/json',
      },
    };

    const response = await httpClient.sendRequest(request);
    if (response.status !== 201) {
      throw new Error(`Failed to register webhook. Status: ${response.status}`);
    }

    const webhookId = response.body.data?.id || response.body.id;
    await context.store?.put('webhookId', webhookId);
  },

  onDisable: async (context) => {
    const subdomain = clickfunnelsCommon.extractSubdomain(context.auth);
    const webhookId = await context.store?.get('webhookId');
    
    if (!webhookId) {
      return;
    }

    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url: `https://${subdomain}.myclickfunnels.com/api/v2/webhooks/outgoing/endpoints/${webhookId}`,
      headers: {
        Authorization: `Bearer ${context.auth.access_token}`,
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
    
    if (payload?.data) {
      return [payload.data];
    }
    
    return [payload];
  },
});
