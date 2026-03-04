import { createAction, Property, httpClient } from '@activepieces/pieces-framework';

export const getImage = createAction({
  name: 'get_image',
  displayName: 'Get Image',
  description: 'Retrieve an image asset from Canva',
  props: {},
  async run(context) {
    // TODO: implement get image via httpClient
    return {};
  },
});
