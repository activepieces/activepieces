import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { agentlineAuth } from '../..';
import { agentlineApiCall } from '../common';

interface AgentlineEvent {
  event_id: string;
  agent_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

interface EventPeekResponse {
  pending_count: number;
  events: AgentlineEvent[];
}

interface EventConsumeResponse {
  events: AgentlineEvent[];
  count: number;
}

interface LastEventState {
  lastEventId: string | null;
}

export const newSmsReceived = createTrigger({
  auth: agentlineAuth,
  name: 'new_sms_received',
  displayName: 'New SMS Received',
  description: 'Triggers when an inbound SMS message is received on an agent\'s number',
  aiMetadata: {
    description:
      'Fires when an inbound SMS text message is received on an Agentline phone number. Each event includes the sender number, message body, and any media URLs.',
  },
  props: {},
  sampleData: {
    event_id: 'evt_sms_sample123',
    agent_id: 'agt_sample456',
    event_type: 'sms.received',
    payload: {
      from_number: '+12125551234',
      to_number: '+14155555678',
      body: 'Hi, I wanted to follow up on our call.',
      media_url: null,
    },
    created_at: '2024-01-01T12:30:00Z',
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const response = await agentlineApiCall<EventPeekResponse>(
      context.auth as string,
      HttpMethod.GET,
      '/v1/events/peek',
      undefined,
      { event_type: 'sms.received' },
    );
    const events = response.body.events ?? [];
    await context.store.put<LastEventState>('_new_sms_received', {
      lastEventId: events.length > 0 ? events[events.length - 1].event_id : null,
    });
  },
  async onDisable(context) {
    await context.store.put('_new_sms_received', null);
  },
  async run(context) {
    const lastState = await context.store.get<LastEventState>('_new_sms_received');

    const response = await agentlineApiCall<EventConsumeResponse>(
      context.auth as string,
      HttpMethod.GET,
      '/v1/events',
      undefined,
      { event_type: 'sms.received' },
    );

    const events = response.body.events ?? [];
    if (events.length === 0) {
      return [];
    }

    let newEvents = events;
    if (lastState?.lastEventId) {
      const lastIndex = events.findIndex(
        (e) => e.event_id === lastState.lastEventId,
      );
      if (lastIndex >= 0) {
        newEvents = events.slice(lastIndex + 1);
      }
    }

    await context.store.put<LastEventState>('_new_sms_received', {
      lastEventId: events[events.length - 1].event_id,
    });

    return newEvents;
  },
});
