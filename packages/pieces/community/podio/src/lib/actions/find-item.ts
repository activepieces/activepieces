import { createAction, Property } from '@activepieces/pieces-framework';

export const findItem = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'findItem',
  displayName: 'Find Item',
  description: 'Retrieve a single item by ID or field value.',
  props: {},
  async run() {
    // Action logic here
  },
});
