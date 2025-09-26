import { createAction, Property } from '@activepieces/pieces-framework';

export const copyFileOrFolder(withinSite) = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'copyFileOrFolder(withinSite)',
  displayName: 'Copy File or Folder (Within Site)',
  description: 'Copy file/folder within the same site to another folder.',
  props: {},
  async run() {
    // Action logic here
  },
});
