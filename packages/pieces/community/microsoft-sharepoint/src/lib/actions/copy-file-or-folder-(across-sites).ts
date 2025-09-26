import { createAction, Property } from '@activepieces/pieces-framework';

export const copyFileOrFolder(acrossSites) = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'copyFileOrFolder(acrossSites)',
  displayName: 'Copy File or Folder (Across Sites)',
  description: 'Copy a file or folder from one site to another within the same tenant, with overwrite option.',
  props: {},
  async run() {
    // Action logic here
  },
});
