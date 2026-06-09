import { createAction } from '@activepieces/pieces-framework';

import { instagramCommon, FacebookPageDropdown } from '../common';

export const uploadReel = createAction({
  auth: instagramCommon.authentication,
  name: 'upload_reel',
  displayName: 'Upload Reel',
  description: 'Upload a reel to an Instagram Professional Account',
  audience: 'both',
  aiMetadata: { description: 'Publishes a video reel to an Instagram Professional (Business/Creator) account linked to a selected Facebook Page, with an optional caption; it waits for the video to finish processing before publishing. Use to post a new reel to Instagram; the video must be a publicly accessible URL (max 1GB or 15 minutes). Not idempotent — each call creates and publishes a new post.', idempotent: false },
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
