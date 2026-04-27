import {
  createTrigger,
  StoreScope,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { callableFlowKey, CallableFlowRequest } from '../common';

export const callableFlow = createTrigger({
  name: 'callableFlow',
  displayName: 'Callable Flow',
  description: 'Starts this flow when another flow calls it. Define the input this flow expects in the test step area.',
  props: {},
  sampleData: null,
  type: TriggerStrategy.WEBHOOK,
  async onEnable() {
    // ignore
  },
  async onDisable() {
    // ignore
  },
  async run(context) {
    return [context.payload.body];
  },
  async onStart(context) {
    const request = context.payload as CallableFlowRequest;
    if (request.callbackUrl) {
      await context.store.put(callableFlowKey(context.run.id), request.callbackUrl, StoreScope.FLOW);
    }
  }
});
