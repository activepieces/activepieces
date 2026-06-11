import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { agentlineAuth } from '../..';
import { triggerOnEnable, triggerOnDisable, triggerRun } from '../common';

const STORE_KEY = '_new_call_completed';
const EVENT_TYPE = 'call.completed';

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
    await triggerOnEnable(context.auth.secret_text, STORE_KEY, EVENT_TYPE, context.store);
  },
  async onDisable(context) {
    await triggerOnDisable(STORE_KEY, context.store);
  },
  async run(context) {
    return await triggerRun(context.auth.secret_text, STORE_KEY, EVENT_TYPE, context.store);
  },
});
