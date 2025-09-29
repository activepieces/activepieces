import { createAction, Property } from '@activepieces/pieces-framework';

export const createDocumentFromFile = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'createDocumentFromFile',
  displayName: 'Create Document from File',
  description: 'Creates new document in mailbox from file.',
  props: {},
  async run() {
    // Action logic here
  },
});
