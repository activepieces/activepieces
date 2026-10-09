import { HttpMethod } from '@activepieces/pieces-common';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatWebhooks } from '../common/webhooks';
import { heartbeatOutputSchemas } from '../common/output-schemas';
import { heartbeatEvents } from '../common/events';
import { heartbeatSamples } from '../common/samples';

export const newEventTrigger = createTrigger({
  auth: heartbeatAuth,
  name: 'heartbeat_new_event',
  displayName: 'New Event',
  description: 'Fires when a new event is created in the community.',
  classification: 'READ',
  aiMetadata: {
    description: 'Fires once when an event is created in the community and returns the event (name, description, start/end time, recurring flag, invited users and groups), re-read from Heartbeat.',
  },
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: heartbeatSamples.event,
  outputSchema: heartbeatOutputSchemas.event,
  async onEnable(context) {
    await heartbeatWebhooks.enable({
      token: context.auth.secret_text,
      store: context.store,
      webhookUrl: context.webhookUrl,
      action: { name: 'EVENT_CREATE' },
    });
  },
  async onDisable(context) {
    await heartbeatWebhooks.disable({ token: context.auth.secret_text, store: context.store });
  },
  async test(context) {
    const events = heartbeatApi.recordList(
      await heartbeatApi.request<unknown>({ token: context.auth.secret_text, method: HttpMethod.GET, path: '/events', operation: 'list events' }),
    );
    return [...events]
      .sort((a, b) => String(b['createdAt'] ?? '').localeCompare(String(a['createdAt'] ?? '')))
      .slice(0, 5);
  },
  async run(context) {
    const eventId = heartbeatWebhooks.uuidOrNull(heartbeatWebhooks.payloadOf(context.payload.body)['id']);
    if (eventId === null) {
      return [];
    }
    const event = await heartbeatWebhooks.fetchOrNull(() => heartbeatEvents.getEvent({ token: context.auth.secret_text, eventId }));
    if (event === null) {
      return [];
    }
    if (!(await heartbeatWebhooks.isFirstDelivery({ store: context.store, key: `EVENT_CREATE:${eventId}` }))) {
      return [];
    }
    return [event];
  },
});
