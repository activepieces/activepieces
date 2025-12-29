import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { heymarketSmsAuth } from '../common/auth';
import { instructionProp } from '../common/props';
export const incommingMessage = createTrigger({
  auth: heymarketSmsAuth,
  name: 'incommingMessage',
  displayName: 'Incomming Message',
  description: 'Triggered when an incoming message is received',
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
    if (body.type === 'message_received') {
      return [body];
    }
    return [];
  },
});
