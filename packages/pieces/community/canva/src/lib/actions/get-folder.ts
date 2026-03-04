import { createAction } from '@activepieces/pieces-framework';

export const getFolder = createAction({
  name: 'get_folder',
  displayName: 'Get a Folder',
  description: 'Retrieves metadata for a specified Canva folder',
  props: {},
  async run(context) {
    // TODO: implement get folder
    throw new Error('getFolder not implemented');
  }
});