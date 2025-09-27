import { createAction, Property } from '@activepieces/pieces-framework';

export const getRowById = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'getRowById',
  displayName: 'Get Row by ID',
  description: 'Retrieve the entire content of a row by its row ID.',
  props: {},
  async run() {
    // Action logic here
  },
});
