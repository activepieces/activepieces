import {
  ApFile,
  createAction,
} from '@activepieces/pieces-framework';
import { TwitterApi } from 'twitter-api-v2';
import { twitterAuth } from '../..';
import { twitterCommon, twitterHelpers } from '../common';
import * as z from 'zod/mini'
import { propsValidation } from '@activepieces/pieces-common';

export const createTweet = createAction({
  auth: twitterAuth,

  name: 'create-tweet',
  classification: 'WRITE',
  displayName: 'Create Tweet',
  description: 'Post a new tweet from the connected X account.',
  audience: 'both',
  aiMetadata: { description: 'Posts a new tweet to the authenticated X/Twitter account, optionally attaching up to three images. Use this to publish a standalone post (not a reply). Tweet text is required and must be non-empty; this is not idempotent, so each call publishes a separate new tweet.', idempotent: false },
  props: {
    text: twitterCommon.text,
    image_1: twitterCommon.image_1,
    image_2: twitterCommon.image_2,
    image_3: twitterCommon.image_3,
  },
  async run(context) {
    await propsValidation.validateZod(context.propsValue, {
      text: z.string().check(z.minLength(1)),
    });

    const { consumerKey, consumerSecret, accessToken, accessTokenSecret } =
      context.auth.props;
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
            mimeType: twitterHelpers.mediaMimeType(m),
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
    } catch (error) {
      throw twitterHelpers.buildError({
        error: twitterHelpers.asTwitterError(error),
        notFoundHint: 'the account or the attached media was not found.',
      });
    }
  },
});
