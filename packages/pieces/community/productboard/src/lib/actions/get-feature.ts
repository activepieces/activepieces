import { createAction, Property } from '@activepieces/pieces-framework';

export const getFeature = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'getFeature',
  displayName: 'Get feature',
  description: 'Gets existing feature.',
  props: {},
  async run() {
    // Action logic here
  },
});
