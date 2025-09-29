import { createAction, Property } from '@activepieces/pieces-framework';

export const createFeature = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'createFeature',
  displayName: 'Create Feature',
  description: 'Create a new feature in Productboard.',
  props: {},
  async run() {
    // Action logic here
  },
});
