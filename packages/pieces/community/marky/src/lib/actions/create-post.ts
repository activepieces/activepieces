import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { markyAuth } from '../auth';
import { markyCommon } from '../common/client';
import { markyProps } from '../common/props';

export const createPostAction = createAction({
  auth: markyAuth,
  name: 'create_post',
  displayName: 'Create Post',
  description: 'Create a post in a Marky business without using the AI generation pipeline.',
  audience: 'both',
  aiMetadata: {
    description:
      'Push a caption you already wrote into a Marky business as a post, optionally with media and target platforms. Use Schedule Post afterwards to set a publish time, or set Status to Scheduled and give a Scheduled Time here. Each call creates a new post, so retries duplicate.',
    idempotent: false,
  },
  props: {
    businessId: markyProps.businessId,
    caption: Property.LongText({
      displayName: 'Caption',
      description: 'The text every platform publishes for this post.',
      required: true,
    }),
    restrictPublishTo: markyProps.restrictPublishTo,
    mediaUrls: Property.Array({
      displayName: 'Media URLs',
      description:
        'Public URLs of images or videos to attach. Marky copies them into its own storage when the post is saved, so each link must be public and exact.',
      required: false,
    }),
    link: Property.ShortText({
      displayName: 'Link',
      description:
        'Destination URL for platforms that support link posts (Facebook attachment, Google Business button, Pinterest destination). Other platforms ignore it.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Initial status. Choose Scheduled together with a Scheduled Time to queue the post.',
      required: false,
      defaultValue: 'NEW',
      options: {
        options: [
          { label: 'New (awaiting review)', value: 'NEW' },
          { label: 'Scheduled', value: 'SCHEDULED' },
        ],
      },
    }),
    scheduledPublishTime: Property.DateTime({
      displayName: 'Scheduled Time',
      description: 'When to publish the post. Required when Status is Scheduled, and must be in the future.',
      required: false,
    }),
  },
  async run(context) {
    const {
      businessId,
      caption,
      restrictPublishTo,
      mediaUrls,
      link,
      status,
      scheduledPublishTime,
    } = context.propsValue;

    if (status === 'SCHEDULED' && !scheduledPublishTime) {
      throw new Error('Scheduled Time is required when Status is Scheduled.');
    }

    const mediaUrlList = toStringArray(mediaUrls);

    const response = await markyCommon.apiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/businesses/${businessId}/posts`,
      body: {
        caption,
        ...(restrictPublishTo && restrictPublishTo.length > 0
          ? { restrict_publish_to: restrictPublishTo }
          : {}),
        ...(mediaUrlList.length > 0 ? { media_urls: mediaUrlList } : {}),
        ...(link ? { link } : {}),
        ...(status ? { status } : {}),
        ...(scheduledPublishTime ? { scheduled_publish_time: scheduledPublishTime } : {}),
      },
    });

    return response.body;
  },
});

function toStringArray(value: unknown[] | undefined): string[] {
  if (!value) {
    return [];
  }
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}
