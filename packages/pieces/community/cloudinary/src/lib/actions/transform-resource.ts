import { createAction, Property } from '@activepieces/pieces-framework';

export const transformResource = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'transformResource',
  displayName: 'Transform Resource',
  description: 'Apply transformations (resize, crop, watermark, etc.) to an asset and generate a new URL.',
  props: {},
  async run() {
    // Action logic here
  },
});
