import { createAction } from '@activepieces/pieces-framework';

export const getImage = createAction({
  name: 'get_image',
  displayName: 'Get an Image',
  description: 'Retrieves metadata for a specified Canva image asset',
  props: {},
  async run(context) {
    // TODO: implement get image
    throw new Error('getImage not implemented');
  }
});