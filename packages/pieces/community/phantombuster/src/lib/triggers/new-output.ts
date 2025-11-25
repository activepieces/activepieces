import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { phantombusterAuth } from '../common/auth';
export const newOutput = createTrigger({
  auth: phantombusterAuth,
  name: 'newOutput',
  displayName: 'New Output',
  description: '',
  props: {},
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // implement webhook creation logic
  },
  async onDisable(context) {
    // implement webhook deletion logic
  },
  async run(context) {
    return [context.payload.body];
  },
});
