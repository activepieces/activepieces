import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { nuelinkAuth } from '../..';

export const createPost = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'createPost',
  auth: nuelinkAuth,
  displayName: 'Create Post',
  description: 'Creates a post on nuelink.',
  audience: 'both',
  aiMetadata: { description: 'Publishes a social media post through Nuelink to the connected social channels, with a required caption and optional media URL, title (for Reels/videos/Pinterest), alt text, and flags to share Instagram Reels to the feed or treat videos as short-form vertical content. Choose this to publish or schedule content via Nuelink. Not idempotent: each call creates a new post.', idempotent: false },
  props: {
    body: Property.LongText({
      displayName: 'Caption',
      required: true,
      description: 'The your post caption here',
    }),
    media: Property.LongText({
      displayName: 'Media',
      required: false,
      description: 'Enter the media URL here',
    }),
    title: Property.LongText({
      displayName: 'Title',
      required: false,
      description: 'Enter a title to use for your Reels, videos and/or Pinterest posts.',
    }),
    altText: Property.LongText({
      displayName: 'Alt Text',
      required: false,
      description: 'Enter an alt text for your image or video.',
    }),
    shareToFeed: Property.Checkbox({
      displayName: 'Share Instagram Reel to Feed',
      required: false,
      description: 'Share your Instagram Reel to your feed as well.',
      defaultValue: false,
    }),
    postAsShort: Property.Checkbox({
      displayName: 'Treat videos as short-form vertical videos',
      required: false,
      description: 'We will treat the videos imported as short-form vertical videos (Reels, Shorts, Tiktoks etc...).',
      defaultValue: false,
    }),
  },

  async run(context) {
    const res = await httpClient.sendRequest<string[]>({
      method: HttpMethod.POST,
      url: 'https://nuelink.com/api/v1/pabbly',
      headers: {
        Authorization: `Bearer ${context.auth.secret_text}`,
      },
      body: {
        body: context.propsValue.body,
        media: context.propsValue.media,
        title: context.propsValue.title,
        altText: context.propsValue.altText,
        shareToFeed: context.propsValue.shareToFeed,
        postAsShort: context.propsValue.postAsShort
      },
    });
    return res.body;
  },

});
