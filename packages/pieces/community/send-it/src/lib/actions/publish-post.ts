import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendItAuth } from '../auth';
import {
  platformProperty,
  textProperty,
  mediaUrlProperty,
  mediaUrlsProperty,
  mediaTypeProperty,
  sendItRequest,
} from '../common';

export const publishPost = createAction({
  auth: sendItAuth,
  name: 'publish_post',
  displayName: 'Publish Post',
  description: 'Publish content to social media platforms immediately',
  audience: 'both',
  aiMetadata: {
    description:
      'Immediately publishes a post (text plus optional image/video URL or a multi-image carousel) to one or more connected social platforms (X, LinkedIn, Instagram, Threads, TikTok, and others). Choose this to post right now rather than at a future time (use Schedule Post for that). Requires at least one selected platform whose account is connected in SendIt; note Instagram and TikTok require a media URL. Not idempotent: each call publishes a new post.',
    idempotent: false,
  },
  props: {
    platforms: platformProperty,
    text: textProperty,
    mediaUrl: mediaUrlProperty,
    mediaUrls: mediaUrlsProperty,
    mediaType: mediaTypeProperty,
  },
  async run(context) {
    const { platforms, text, mediaUrl, mediaUrls, mediaType } =
      context.propsValue;

    return await sendItRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/publish',
      {
        platforms,
        content: {
          text,
          mediaUrl,
          mediaUrls,
          mediaType,
        },
      }
    );
  },
});
