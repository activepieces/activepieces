import { createAction, Property } from '@activepieces/pieces-framework';

export const createDocument = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'createDocument',
  displayName: 'Create Document',
  description: 'Creates a new document.',
  props: {},
  async run() {
    // Action logic here
  },
});
