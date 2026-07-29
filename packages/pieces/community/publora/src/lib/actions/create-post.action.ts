import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { publoraAuth } from '../auth';
import { publoraApiCall } from '../common/client';
import { channelIdsProp } from '../common/props';

export const createPostAction = createAction({
  auth: publoraAuth,
  name: 'create_post',
  displayName: 'Create Post',
  description: 'Publish or schedule a post to your connected social accounts.',
  props: {
    content: Property.LongText({
      displayName: 'Content',
      description: 'The text of the post.',
      required: true,
    }),
    platforms: channelIdsProp,
    scheduledTime: Property.DateTime({
      displayName: 'Scheduled Time',
      description:
        'When to publish, at least five minutes from now. Leave empty to save the post as a draft in Publora.',
      required: false,
    }),
    mediaUrls: Property.Array({
      displayName: 'Media URLs',
      description:
        'Public https links to images or videos, up to 10. Publora downloads them server-side. Instagram, TikTok and YouTube require media.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { content, platforms, scheduledTime, mediaUrls } = propsValue;

    const media = (mediaUrls ?? []) as string[];

    return await publoraApiCall({
      apiKey: auth,
      method: HttpMethod.POST,
      resourceUri: '/create-post',
      body: {
        content,
        platforms,
        ...(scheduledTime
          ? { scheduledTime: new Date(scheduledTime).toISOString() }
          : {}),
        ...(media.length ? { mediaUrls: media } : {}),
      },
    });
  },
});
