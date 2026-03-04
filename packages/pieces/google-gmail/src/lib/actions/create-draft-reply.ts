import { createAction } from '@activepieces/pieces-framework';
export const createDraftReply = createAction({
  name: 'createDraftReply',
  displayName: 'Create Draft Reply',
  description: 'Generate a reply draft within an existing thread.',
  props: {},
  async run() { throw new Error('Not implemented'); }
});