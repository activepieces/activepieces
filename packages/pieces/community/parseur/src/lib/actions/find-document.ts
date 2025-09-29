import { createAction, Property } from '@activepieces/pieces-framework';

export const findDocument = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'findDocument',
  displayName: 'Find Document',
  description: 'Finds a document based on search param.',
  props: {},
  async run() {
    // Action logic here
  },
});
