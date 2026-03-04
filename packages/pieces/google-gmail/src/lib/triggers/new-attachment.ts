import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const newAttachment = createTrigger({
  name: 'newAttachment',
  displayName: 'New Attachment',
  description: 'Fires when an email with an attachment arrives (with optional filters).',
  props: {},
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async test() { throw new Error('Not implemented'); },
  async onEnable() {},
  async onDisable() {},
  async run() { return []; }
});