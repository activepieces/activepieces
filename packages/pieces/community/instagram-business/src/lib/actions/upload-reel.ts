import { createAction } from '@activepieces/pieces-framework';

import { instagramCommon, FacebookPageDropdown } from '../common';

export const uploadReel = createAction({
  auth: instagramCommon.authentication,
  name: 'upload_reel',
  displayName: 'Upload Reel',
  description: 'Upload a reel to an Instagram Professional Account',
  props: {
    page: instagramCommon.page,
    video: instagramCommon.video,
    caption: instagramCommon.caption,
  },
  async run(context) {
    const page: FacebookPageDropdown = context.propsValue.page!;
    const result = await instagramCommon.createVideoPost(
      page,
      context.propsValue.caption,
      context.propsValue.video
    );
    return result;
  },
});
