import { createAction, Property } from '@activepieces/pieces-framework';

export const clearRowById = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'clearRowById',
  displayName: 'Clear Row by ID',
  description: 'Clear contents/formatting of an entire row by its ID.',
  props: {},
  async run() {
    // Action logic here
  },
});
