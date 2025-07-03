import {
    ApFile,
    Property,
    createAction,
  } from '@activepieces/pieces-framework';
import { TwitterApi } from 'twitter-api-v2';
import { twitterAuth } from '../..';
import { twitterCommon } from '../common';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';

export const createReply = createAction({
    auth: twitterAuth,
  
    name: 'create-reply',
    displayName: 'Create Reply',
    description: 'Reply to a tweet.',
    props: {
      tweet_id: Property.LongText({
        displayName: 'Tweet ID',
        description: 'The ID of the tweet to reply too.',
        required: true,
      }),
      text: twitterCommon.text,
      image_1: twitterCommon.image_1,
      image_2: twitterCommon.image_2,
      image_3: twitterCommon.image_3,
    },
    async run(context) {
      await propsValidation.validateZod(context.propsValue, {
        text: z.string().min(1),
      });

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
            ? await userClient.v2.reply(context.propsValue.text, context.propsValue.tweet_id, {
                media: {
                  media_ids: [...uploaded],
                },
              })
            : await userClient.v2.reply(context.propsValue.text, context.propsValue.tweet_id);
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