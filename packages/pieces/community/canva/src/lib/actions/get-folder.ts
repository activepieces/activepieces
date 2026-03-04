import { createAction, Property, httpClient } from '@activepieces/pieces-framework';

export const getFolder = createAction({
  name: 'get_folder',
  displayName: 'Get Folder',
  description: 'Retrieve folder details from Canva',
  props: {},
  async run(context) {
    // TODO: implement get folder via httpClient
    return {};
  },
});
