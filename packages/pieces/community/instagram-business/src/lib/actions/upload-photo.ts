import { createAction } from '@activepieces/pieces-framework';

import { instagramCommon, FacebookPageDropdown } from '../common';

export const uploadPhoto = createAction({
  auth: instagramCommon.authentication,
  name: 'upload_photo',
  displayName: 'Upload Photo',
  description: 'Upload a photo to an Instagram Professional Account',
  audience: 'both',
  aiMetadata: { description: 'Publishes a single photo post to an Instagram Professional (Business/Creator) account linked to a selected Facebook Page, with an optional caption. Use to post a new image to Instagram; the photo must be supplied as a publicly accessible JPG URL. Not idempotent — each call creates and publishes a new post.', idempotent: false },
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
