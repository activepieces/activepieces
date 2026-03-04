import { createAction } from '@activepieces/pieces-framework';
export const deleteEmail = createAction({
  name: 'deleteEmail',
  displayName: 'Delete Email',
  description: 'Delete an email message.',
  props: {},
  async run() { throw new Error('Not implemented'); }
});