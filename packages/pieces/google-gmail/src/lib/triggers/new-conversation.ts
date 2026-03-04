import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const newConversation = createTrigger({
  name: 'newConversation',
  displayName: 'New Conversation',
  description: 'Fires when a new conversation (thread) begins.',
  props: {},
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async test() { throw new Error('Not implemented'); },
  async onEnable() {},
  async onDisable() {},
  async run() { return []; }
});