import {
  ApFile,
  Property,
  Validators,
  createAction,
} from '@activepieces/pieces-framework';
import { TwitterApi } from 'twitter-api-v2';
import { twitterAuth } from '../..';

export const createTweet = createAction({
  auth: twitterAuth,

  name: 'create-tweet',
  displayName: 'Create Tweet',
  description: 'Create a tweet',
  props: {
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text of the tweet',
      required: true,
      validators: [Validators.minLength(1)],
    }),
    image_1: Property.File({
      displayName: 'Media (1)',
      description:
        'An image, video or GIF url or base64 to attach to the tweet',
      required: false,
    }),
    image_2: Property.File({
      displayName: 'Media (2)',
      description:
        'An image, video or GIF url or base64 to attach to the tweet',
      required: false,
    }),
    image_3: Property.File({
      displayName: 'Media (3)',
      description:
        'An image, video or GIF url or base64 to attach to the tweet',
      required: false,
    }),
  },
  async run(context) {
    const { consumerKey, consumerSecret, accessToken, accessTokenSecret } =
      context.auth;
    const userClient = new TwitterApi({
      appKey: consumerKey,
      appSecret: consumerSecret,
      accessToken: accessToken,
      accessSecret: accessTokenSecret,
    });

    try {
      const media: ApFile[] = [
        context.propsValue.image_1,
        context.propsValue.image_2,
        context.propsValue.image_3,
      ].filter((m): m is ApFile => !!m);
      const uploadedMedia: Promise<string>[] = [];
      media.forEach((m) => {
        uploadedMedia.push(
          userClient.v1.uploadMedia(Buffer.from(m.base64, 'base64'), {
            mimeType: 'image/png',
            target: 'tweet',
          })
        );
      });
      const uploaded = await Promise.all(uploadedMedia);

      const response =
        uploaded.length > 0
          ? await userClient.v2.tweet(context.propsValue.text, {
              media: {
                media_ids: [...uploaded],
              },
            })
          : await userClient.v2.tweet(context.propsValue.text);
      return response || { success: true };
    } catch (error: any) {
      throw new Error(
        JSON.stringify({
          code: error.code,
          errors: error.errors,
        })
      );
    }
  },
});
