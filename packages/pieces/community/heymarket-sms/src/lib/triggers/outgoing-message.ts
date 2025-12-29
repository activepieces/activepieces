import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { instructionProp } from '../common/props';
import { heymarketSmsAuth } from '../common/auth';
export const outgoingMessage = createTrigger({
  auth: heymarketSmsAuth,
  name: 'outgoingMessage',
  displayName: 'Outgoing Message',
  description: 'Triggered when an outgoing message is sent',
  props: { instruction: instructionProp },
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // implement webhook creation logic
  },
  async onDisable(context) {
    // implement webhook deletion logic
  },
  async run(context) {
    const body = context.payload.body as any;
    if (body && body.type === 'message_sent') {
      return [body];
    }
    return [];
  },
});
