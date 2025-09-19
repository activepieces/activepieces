import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { nuelinkAuth } from '../..';

export const createPost = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'createPost',
  auth: nuelinkAuth,
  displayName: 'create post',
  description: 'create a post on nuelink',
  props: {
    body: Property.LongText({
      displayName: 'Caption (Required)',
      required: true,
      description: 'The your post caption here',
    }),
    media: Property.LongText({
      displayName: 'Media (Optional)',
      required: false,
      description: 'Enter the media URL here',
    }),
    title: Property.LongText({
      displayName: 'Title (Optional)',
      required: false,
      description: 'Enter a title to use for your Reels, videos and/or Pinterest posts.',
    }),
    altText: Property.LongText({
      displayName: 'Alt Text (Optional)',
      required: false,
      description: 'Enter an alt text for your image or video.',
    }),
    shareToFeed: Property.Checkbox({
      displayName: 'Share Instagram Reel to Feed (Optional)',
      required: false,
      description: 'Share your Instagram Reel to your feed as well.',
      defaultValue: false,
    }),
    postAsShort: Property.Checkbox({
      displayName: 'Treat videos as short-form vertical videos (Optional)',
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
        Authorization: `Bearer ${context.auth}`,
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
