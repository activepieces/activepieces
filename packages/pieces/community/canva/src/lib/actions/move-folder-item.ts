import { createAction, Property, httpClient } from '@activepieces/pieces-framework';

export const moveFolderItem = createAction({
  name: 'move_folder_item',
  displayName: 'Move Folder Item',
  description: 'Move an item into a different folder in Canva',
  props: {},
  async run(context) {
    // TODO: implement move folder item via httpClient
    return {};
  },
});
