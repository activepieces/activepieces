import { createAction } from '@activepieces/pieces-framework';

import { facebookPagesCommon, FacebookPageDropdown } from '../common/common';
import { facebookPagesAuth } from '../..';

export const createPhotoPost = createAction({
  auth: facebookPagesAuth,

  name: 'create_photo_post',
  displayName: 'Create Page Photo',
  description: 'Create a photo on a Facebook Page you manage',
  props: {
    page: facebookPagesCommon.page,
    photo: facebookPagesCommon.photo,
    caption: facebookPagesCommon.caption,
  },
  async run(context) {
    const page: FacebookPageDropdown = context.propsValue.page!;

    const result = await facebookPagesCommon.createPhotoPost(
      page,
      context.propsValue.caption,
      context.propsValue.photo
    );

    return result;
  },
});
