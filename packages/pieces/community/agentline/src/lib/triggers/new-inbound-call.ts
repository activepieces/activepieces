import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { agentlineAuth } from '../..';
import { triggerOnEnable, triggerOnDisable, triggerRun } from '../common';

const STORE_KEY = '_new_inbound_call';
const EVENT_TYPE = 'call.received';

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
    await triggerOnEnable(context.auth.secret_text, STORE_KEY, EVENT_TYPE, context.store);
  },
  async onDisable(context) {
    await triggerOnDisable(STORE_KEY, context.store);
  },
  async run(context) {
    return await triggerRun(context.auth.secret_text, STORE_KEY, EVENT_TYPE, context.store);
  },
});
