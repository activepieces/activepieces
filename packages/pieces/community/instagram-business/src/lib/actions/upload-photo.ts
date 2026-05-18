import { createAction } from '@activepieces/pieces-framework';

import { instagramCommon, FacebookPageDropdown } from '../common';

export const uploadPhoto = createAction({
  auth: instagramCommon.authentication,
  name: 'upload_photo',
  displayName: 'Upload Photo',
  description: 'Upload a photo to an Instagram Professional Account',
  props: {
    page: instagramCommon.page,
    photo: instagramCommon.photo,
    caption: instagramCommon.caption,
  },
  async run({ propsValue }) {
    const page: FacebookPageDropdown = propsValue.page!;
    const result = await instagramCommon.createPhotoPost(
      page,
      propsValue.caption,
      propsValue.photo
    );
    return result;
  },
});
