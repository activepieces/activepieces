import { createAction } from '@activepieces/pieces-framework';
export const replyToEmail = createAction({
  name: 'replyToEmail',
  displayName: 'Reply to Email',
  description: 'Reply within an existing thread, maintaining context.',
  props: {},
  async run() { throw new Error('Not implemented'); }
});