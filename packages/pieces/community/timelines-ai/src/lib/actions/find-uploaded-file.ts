import { createAction, Property } from '@activepieces/pieces-framework';

export const findUploadedFile = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'findUploadedFile',
  displayName: 'Find Uploaded File',
  description: 'Locate an uploaded file by filename or identifier.',
  props: {},
  async run() {
    // Action logic here
  },
});
