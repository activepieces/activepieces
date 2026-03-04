import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const newStarredEmail = createTrigger({
  name: 'newStarredEmail',
  displayName: 'New Starred Email',
  description: 'Fires when an email is starred (within 2 days).',
  props: {},
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async test() { throw new Error('Not implemented'); },
  async onEnable() {},
  async onDisable() {},
  async run() { return []; }
});