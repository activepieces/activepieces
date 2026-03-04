import { createAction } from '@activepieces/pieces-framework';

export const moveFolderItem = createAction({
  name: 'move_folder_item',
  displayName: 'Move Folder Item',
  description: 'Moves a design or asset to a different folder in Canva',
  props: {},
  async run(context) {
    // TODO: implement move folder item
    throw new Error('moveFolderItem not implemented');
  }
});