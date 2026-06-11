import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { agentlineAuth } from '../..';
import { triggerOnEnable, triggerOnDisable, triggerRun } from '../common';

const STORE_KEY = '_new_sms_received';
const EVENT_TYPE = 'sms.received';

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
    await triggerOnEnable(context.auth.secret_text, STORE_KEY, EVENT_TYPE, context.store);
  },
  async onDisable(context) {
    await triggerOnDisable(STORE_KEY, context.store);
  },
  async run(context) {
    return await triggerRun(context.auth.secret_text, STORE_KEY, EVENT_TYPE, context.store);
  },
});
