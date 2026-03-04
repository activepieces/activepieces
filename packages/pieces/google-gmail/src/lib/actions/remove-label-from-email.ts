import { createAction } from '@activepieces/pieces-framework';
export const removeLabelFromEmail = createAction({
  name: 'removeLabelFromEmail',
  displayName: 'Remove Label from Email',
  description: 'Remove a specific label from an email.',
  props: {},
  async run() { throw new Error('Not implemented'); }
});