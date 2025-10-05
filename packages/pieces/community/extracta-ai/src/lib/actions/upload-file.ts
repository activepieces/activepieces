import { createAction, Property } from '@activepieces/pieces-framework';

export const uploadFile = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'uploadFile',
  displayName: 'Upload File',
  description: 'Uploads document for extraction.',
  props: {},
  async run() {
    // Action logic here
  },
});
