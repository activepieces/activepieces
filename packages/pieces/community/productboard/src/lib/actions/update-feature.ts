import { createAction, Property } from '@activepieces/pieces-framework';

export const updateFeature = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'updateFeature',
  displayName: 'Update Feature',
  description: 'Updates an existing feature.',
  props: {},
  async run() {
    // Action logic here
  },
});
