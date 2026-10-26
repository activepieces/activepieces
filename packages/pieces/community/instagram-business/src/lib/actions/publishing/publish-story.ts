import {
  createAction,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';

import { publishedMediaOutputSchema } from '../../output-schemas';
import { instagramCommon, FacebookPageDropdown } from '../../common';

export const publishStory = createAction({
  auth: instagramCommon.authentication,
  outputSchema: publishedMediaOutputSchema,
  name: 'publish_story',
  classification: 'WRITE',
  displayName: 'Publish Story',
  description: 'Publish a photo or video story that disappears after 24 hours.',
  audience: 'both',
  aiMetadata: {
    description:
      'Publishes one photo or video as an Instagram story, which expires after 24 hours. Supply exactly one of Photo URL or Video URL, and the media must be reachable at a public URL. Use Upload Photo or Upload Reel instead for permanent feed posts. Not idempotent — each call publishes a new story.',
    idempotent: false,
  },
  propertyGroups: [
    { key: 'account', display: 'section', label: 'Account', icon: 'user', props: ['page'] },
    { key: 'story', display: 'section', label: 'Story', icon: 'file', props: ['story_info', 'photo', 'video'] },
  ],
  props: {
    page: instagramCommon.page,
    story_info: Property.MarkDown({
      value: 'Fill in Photo URL or Video URL, not both.',
      variant: MarkdownVariant.INFO,
    }),
    photo: Property.ShortText({
      displayName: 'Photo URL',
      description: 'Public link to a JPG image.',
      placeholder: 'https://example.com/photo.jpg',
      required: false,
    }),
    video: Property.ShortText({
      displayName: 'Video URL',
      description: 'Public link to the video.',
      placeholder: 'https://example.com/story.mp4',
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
