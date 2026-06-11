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

export const newInboundCall = createTrigger({
  auth: agentlineAuth,
  name: 'new_inbound_call',
  displayName: 'New Inbound Call',
  description: 'Triggers when someone calls one of your agent\'s phone numbers',
  aiMetadata: {
    description:
      'Fires when an inbound phone call is received on an Agentline phone number. The AI agent handles the call automatically; this trigger notifies your flow that it happened.',
  },
  props: {},
  sampleData: {
    event_id: 'evt_call_sample123',
    agent_id: 'agt_sample456',
    event_type: 'call.received',
    payload: {
      call_id: 'call_inbound789',
      from_number: '+12125551234',
      to_number: '+14155555678',
      direction: 'inbound',
    },
    created_at: '2024-01-01T14:00:00Z',
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const response = await agentlineApiCall<EventPeekResponse>(
      context.auth as string,
      HttpMethod.GET,
      '/v1/events/peek',
      undefined,
      { event_type: 'call.received' },
    );
    const events = response.body.events ?? [];
    await context.store.put<LastEventState>('_new_inbound_call', {
      lastEventId: events.length > 0 ? events[events.length - 1].event_id : null,
    });
  },
  async onDisable(context) {
    await context.store.put('_new_inbound_call', null);
  },
  async run(context) {
    const lastState = await context.store.get<LastEventState>('_new_inbound_call');

    const response = await agentlineApiCall<EventConsumeResponse>(
      context.auth as string,
      HttpMethod.GET,
      '/v1/events',
      undefined,
      { event_type: 'call.received' },
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

    await context.store.put<LastEventState>('_new_inbound_call', {
      lastEventId: events[events.length - 1].event_id,
    });

    return newEvents;
  },
});
