import { createAction, Property } from '@activepieces/pieces-framework';

import { markyAuth } from '../auth';
import { markyClient, PostCreateRequest } from '../common/client';
import { markyProps } from '../common/props';
import { markyUtils } from '../common/utils';

const createPostAction = createAction({
  auth: markyAuth,
  name: 'create-post',
  displayName: 'Create Post',
  description:
    'Create a post directly in Marky without using the generation pipeline.',
  props: {
    businessId: markyProps.business(),
    caption: Property.LongText({
      displayName: 'Caption',
      description: 'The text content of the post.',
      required: true,
    }),
    publishTo: markyProps.platforms(),
    mediaUrls: Property.Array({
      displayName: 'Media URLs',
      description: 'Image or video URLs to attach to the post.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description:
        'Initial post status. Use Scheduled with Scheduled Time to queue the post.',
      required: false,
      defaultValue: 'NEW',
      options: {
        options: [
          { label: 'New (draft)', value: 'NEW' },
          { label: 'Scheduled', value: 'SCHEDULED' },
        ],
      },
    }),
    adhocPublishTime: Property.DateTime({
      displayName: 'Scheduled Time',
      description:
        'When to publish the post (ISO 8601). Required when Status is Scheduled.',
      required: false,
    }),
  },
  async run(context) {
    const businessId = markyUtils.getRequiredString({
      value: context.propsValue.businessId,
      fieldName: 'Business',
    });
    const caption = markyUtils.getRequiredString({
      value: context.propsValue.caption,
      fieldName: 'Caption',
    });
    const publishTo = markyUtils.getOptionalStringArray({
      value: context.propsValue.publishTo,
      fieldName: 'Platforms',
    });
    const mediaUrls = markyUtils.getOptionalStringArray({
      value: context.propsValue.mediaUrls,
      fieldName: 'Media URLs',
    });
    const adhocPublishTime = markyUtils.getOptionalString({
      value: context.propsValue.adhocPublishTime,
    });

    const statusValue = context.propsValue.status;
    const status: 'NEW' | 'SCHEDULED' | undefined =
      statusValue === 'NEW' || statusValue === 'SCHEDULED' ? statusValue : undefined;

    if (status === 'SCHEDULED' && adhocPublishTime === undefined) {
      throw new Error('Scheduled Time is required when Status is Scheduled.');
    }

    const body: PostCreateRequest = {
      business_id: businessId,
      caption,
    };
    if (publishTo !== undefined) body.publish_to = publishTo;
    if (mediaUrls !== undefined) body.media_urls = mediaUrls;
    if (status !== undefined) body.status = status;
    if (adhocPublishTime !== undefined) body.adhoc_publish_time = adhocPublishTime;

    const result = await markyClient.createPost({
      apiKey: context.auth.secret_text,
      body,
    });

    if (!result.ok) {
      throw new Error(`Failed to create post: ${result.message}`);
    }

    return result.data;
  },
});

export { createPostAction };
