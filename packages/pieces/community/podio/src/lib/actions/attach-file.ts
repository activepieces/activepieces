import { createAction, Property } from '@activepieces/pieces-framework';

export const attachFile = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'attachFile',
  displayName: 'Attach File',
  description: 'Upload and attach a file to an item/task/comment.',
  props: {},
  async run() {
    // Action logic here
  },
});
