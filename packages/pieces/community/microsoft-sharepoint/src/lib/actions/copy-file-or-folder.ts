import { createAction, Property } from '@activepieces/pieces-framework';

export const copyFileOrFolder = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'copyFileOrFolder',
  displayName: 'Copy File or Folder',
  description: 'Copy a file or folder from one site to another within the same tenant, with overwrite option.',
  props: {},
  async run() {
    // Action logic here
  },
});
