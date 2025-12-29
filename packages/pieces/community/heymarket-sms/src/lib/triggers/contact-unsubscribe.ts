import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { instructionProp } from '../common/props';
import { heymarketSmsAuth } from '../common/auth';
export const contactUnsubscribe = createTrigger({
  auth: heymarketSmsAuth,
  name: 'contactUnsubscribe',
  displayName: 'Contact Unsubscribe',
  description: 'Triggered when a contact unsubscribes',
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
    if (body.type === 'contact_unsubscribed' || body.type === 'contact_opt_out') {
      return [body];
    }
    return [];
  },
});
