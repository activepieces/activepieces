import { createAction, Property } from '@activepieces/pieces-framework';

import { publishedMediaOutputSchema } from '../../output-schemas';
import { instagramCommon, FacebookPageDropdown } from '../../common';

export const publishStory = createAction({
  auth: instagramCommon.authentication,
  outputSchema: publishedMediaOutputSchema,
  name: 'publish_story',
  classification: 'WRITE',
  displayName: 'Publish Story',
  description: 'Publish a photo or video story to an Instagram professional account.',
  audience: 'both',
  aiMetadata: {
    description:
      'Publishes one photo or video as an Instagram story, which expires after 24 hours. Supply exactly one of Photo URL or Video URL, and the media must be reachable at a public URL. Use Publish Photo or Publish Reel instead for permanent feed posts. Not idempotent — each call publishes a new story.',
    idempotent: false,
  },
  props: {
    page: instagramCommon.page,
    photo: Property.ShortText({
      displayName: 'Photo URL',
      description: 'Public URL of a JPG image. Leave empty when publishing a video story.',
      required: false,
    }),
    video: Property.ShortText({
      displayName: 'Video URL',
      description: 'Public URL of a video. Leave empty when publishing a photo story.',
      required: false,
    }),
  },
  async run({ propsValue }) {
    const page: FacebookPageDropdown = propsValue.page;
    const { photo, video } = propsValue;

    if (!photo && !video) {
      throw new Error('Provide either a Photo URL or a Video URL.');
    }
    if (photo && video) {
      throw new Error('Provide only one of Photo URL or Video URL, not both.');
    }

    return instagramCommon.publishMedia({
      page,
      body: photo
        ? { image_url: photo, media_type: 'STORIES' }
        : { video_url: video, media_type: 'STORIES' },
    });
  },
});
