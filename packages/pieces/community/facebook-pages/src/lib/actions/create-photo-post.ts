import { createAction } from '@activepieces/pieces-framework';

import { facebookPagesCommon, FacebookPageDropdown } from '../common/common';
import { facebookPagesAuth } from '../..';

export const createPhotoPost = createAction({
  auth: facebookPagesAuth,

  name: 'create_photo_post',
  displayName: 'Create Page Photo',
  description: 'Create a photo on a Facebook Page you manage',
  audience: 'both',
  aiMetadata: { description: 'Publishes a photo post to a Facebook Page the connected account manages by uploading an image from a publicly reachable URL, with an optional caption. Choose this when the post is an image rather than plain text or video. Requires a managed page and a photo URL that Facebook can fetch; not idempotent, as each call creates a new photo post.', idempotent: false },
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
