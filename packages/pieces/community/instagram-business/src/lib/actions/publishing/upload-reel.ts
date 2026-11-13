import { createAction } from '@activepieces/pieces-framework';

import { publishedMediaOutputSchema } from '../../output-schemas';
import { instagramCommon, FacebookPageDropdown } from '../../common';

export const uploadReel = createAction({
  auth: instagramCommon.authentication,
  outputSchema: publishedMediaOutputSchema,
  name: 'upload_reel',
  classification: 'WRITE',
  displayName: 'Upload Reel',
  description: 'Publish a video to your Instagram account as a reel.',
  audience: 'both',
  aiMetadata: { description: 'Publishes a video reel to an Instagram Professional (Business/Creator) account linked to a selected Facebook Page, with an optional caption; it waits for the video to finish processing before publishing. Use to post a new reel to Instagram; the video must be a publicly accessible URL (max 1GB or 15 minutes). Not idempotent — each call creates and publishes a new post.', idempotent: false },
  propertyGroups: [
    { key: 'account', display: 'section', label: 'Account', icon: 'user', props: ['page'] },
    { key: 'reel', display: 'section', label: 'Reel', icon: 'file', props: ['video', 'caption'] },
  ],
  props: {
    page: instagramCommon.page,
    video: instagramCommon.video,
    caption: instagramCommon.caption,
  },
  async run({ propsValue }) {
    const page: FacebookPageDropdown = propsValue.page;
    return instagramCommon.createVideoPost({
      page,
      caption: propsValue.caption,
      video: propsValue.video,
    });
  },
});
