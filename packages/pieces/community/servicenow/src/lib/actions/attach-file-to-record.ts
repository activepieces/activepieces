import { createAction, Property } from '@activepieces/pieces-framework';

export const attachFileToRecord = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'attachFileToRecord',
  displayName: 'Attach File to Record',
  description: 'Upload a file and attach it to a record in a table.',
  props: {},
  async run() {
    // Action logic here
  },
});
