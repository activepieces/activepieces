import { createAction, Property } from '@activepieces/pieces-framework';
import { nuelinkAuths } from '../auth';
import { nuelinkClient } from '../common/client';

export const createPost = createAction({
  name: 'createPost',
  classification: 'WRITE',
  auth: nuelinkAuths,
  displayName: 'Create Post',
  description: 'Adds a post to the collection linked to your Nuelink automation token. Needs an Automation Token connection; with an API key, use Create Post in Collection.',
  audience: 'human',
  aiMetadata: {
    description:
      'Adds a post to the single Nuelink collection tied to this connection\'s automation token; the post then follows that collection\'s channels and schedule. It cannot choose the collection, publish mode or time, and needs an Automation Token connection; prefer Create Post in Collection. Each call creates a new post, so retries duplicate it.',
    idempotent: false,
  },
  props: {
    body: Property.LongText({
      displayName: 'Caption',
      required: true,
      description: 'The text of the post.',
    }),
    media: Property.LongText({
      displayName: 'Media',
      required: false,
      description: 'Public URL of one image or video. Nuelink downloads it, so it must open without a login.',
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
    const token = nuelinkClient.legacyTokenOf({ auth: context.auth });
    const { body, media, title, altText, shareToFeed, postAsShort } = context.propsValue;
    const mediaUrl = typeof media === 'string' && media.trim().length > 0 ? media.trim() : undefined;
    return nuelinkClient.legacyCreatePost({
      token,
      body: { body, media: mediaUrl, title, altText, shareToFeed, postAsShort },
    });
  },
});
