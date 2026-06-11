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

export const newCallCompleted = createTrigger({
  auth: agentlineAuth,
  name: 'new_call_completed',
  displayName: 'New Call Completed',
  description:
    'Triggers when a voice call finishes. Includes full transcript and call details.',
  aiMetadata: {
    description:
      'Fires when an Agentline voice call completes. Each event includes the full conversation transcript, call duration, and phone numbers.',
  },
  props: {},
  sampleData: {
    event_id: 'evt_sample123',
    agent_id: 'agt_sample456',
    event_type: 'call.completed',
    payload: {
      call_id: 'call_sample789',
      from_number: '+12125551234',
      to_number: '+14155555678',
      direction: 'outbound',
      duration_seconds: 45,
      transcript: [
        { role: 'agent', text: 'Hello, how can I help you today?', timestamp: '2024-01-01T00:00:00Z' },
        { role: 'human', text: 'I have a question about my order.', timestamp: '2024-01-01T00:00:05Z' },
      ],
    },
    created_at: '2024-01-01T00:00:50Z',
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    // Peek at current events to set the baseline
    const response = await agentlineApiCall<EventPeekResponse>(
      context.auth as string,
      HttpMethod.GET,
      '/v1/events/peek',
      undefined,
      { event_type: 'call.completed' },
    );
    const events = response.body.events ?? [];
    await context.store.put<LastEventState>('_new_call_completed', {
      lastEventId: events.length > 0 ? events[events.length - 1].event_id : null,
    });
  },
  async onDisable(context) {
    await context.store.put('_new_call_completed', null);
  },
  async run(context) {
    const lastState = await context.store.get<LastEventState>('_new_call_completed');

    // Consume events from the mailbox
    const response = await agentlineApiCall<EventConsumeResponse>(
      context.auth as string,
      HttpMethod.GET,
      '/v1/events',
      undefined,
      { event_type: 'call.completed' },
    );

    const events = response.body.events ?? [];
    if (events.length === 0) {
      return [];
    }

    // Filter out events we've already seen
    let newEvents = events;
    if (lastState?.lastEventId) {
      const lastIndex = events.findIndex(
        (e) => e.event_id === lastState.lastEventId,
      );
      if (lastIndex >= 0) {
        newEvents = events.slice(lastIndex + 1);
      }
    }

    // Update the cursor
    await context.store.put<LastEventState>('_new_call_completed', {
      lastEventId: events[events.length - 1].event_id,
    });

    return newEvents;
  },
});
