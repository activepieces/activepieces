import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { heymarketSmsAuth } from '../common/auth';
import { instructionProp } from '../common/props';
export const chatStarted = createTrigger({
  auth: heymarketSmsAuth,
  name: 'chatStarted',
  displayName: 'Chat Started',
  description: 'Triggered when a new chat is started',
  props: {
    instruction: instructionProp,
  },
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
    if (body.type === 'chat_started') {
      return [body];
    }
    return [];
  },
});
