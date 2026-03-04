import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const newLabel = createTrigger({
  name: 'newLabel',
  displayName: 'New Label',
  description: 'Triggers when a new label is created.',
  props: {},
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async test() { throw new Error('Not implemented'); },
  async onEnable() {},
  async onDisable() {},
  async run() { return []; }
});