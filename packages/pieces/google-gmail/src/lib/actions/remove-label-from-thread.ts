import { createAction } from '@activepieces/pieces-framework';
export const removeLabelFromThread = createAction({
  name: 'removeLabelFromThread',
  displayName: 'Remove Label from Thread',
  description: 'Remove a specific label from a thread.',
  props: {},
  async run() { throw new Error('Not implemented'); }
});