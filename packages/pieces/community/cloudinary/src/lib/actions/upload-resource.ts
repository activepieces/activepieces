import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../common/auth';

export const uploadResource = createAction({
  auth: cloudinaryAuth,
  name: 'uploadResource',
  displayName: 'Upload Resource',
  description: 'Upload a new image, video, or file to Cloudinary.',
  props: {},
  async run({auth,propsValue}) {
    // Action logic here
  },
});
