import { createAction } from '@activepieces/pieces-framework';
export const archiveEmail = createAction({
  name: 'archiveEmail',
  displayName: 'Archive Email',
  description: 'Archive (move to All Mail) rather than deleting.',
  props: {},
  async run() { throw new Error('Not implemented'); }
});