import { createAction, Property } from '@activepieces/pieces-framework';

export const extractFileData = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'extractFileData',
  displayName: 'Extract File Data',
  description: 'Upload a file and immediately receive extracted content.',
  props: {},
  async run() {
    // Action logic here
  },
});
