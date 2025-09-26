import { createAction, Property } from '@activepieces/pieces-framework';

export const getFolderContents = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'getFolderContents',
  displayName: 'Get Folder Contents',
  description: 'List all files and subfolders in a specified folder, optionally with detailed metadata.',
  props: {},
  async run() {
    // Action logic here
  },
});
