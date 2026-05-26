import { createAction, Property } from '@activepieces/pieces-framework';

import { markyAuth } from '../auth';
import { markyClient, PostScheduleRequest } from '../common/client';
import { markyProps } from '../common/props';
import { markyUtils } from '../common/utils';

const schedulePostAction = createAction({
  auth: markyAuth,
  name: 'schedule-post',
  displayName: 'Schedule Post',
  description: 'Schedule an existing Marky post for publishing at a specific time.',
  props: {
    postId: Property.ShortText({
      displayName: 'Post ID',
      description: 'The ID of the post to schedule. Must be in NEW or SCHEDULED status.',
      required: true,
    }),
    publishAt: Property.DateTime({
      displayName: 'Publish At',
      description: 'When to publish (ISO 8601 datetime, must be in the future).',
      required: true,
    }),
    publishTo: markyProps.platforms(),
  },
  async run(context) {
    const postId = markyUtils.getRequiredString({
      value: context.propsValue.postId,
      fieldName: 'Post ID',
    });
    const publishAt = markyUtils.getRequiredString({
      value: context.propsValue.publishAt,
      fieldName: 'Publish At',
    });
    const publishTo = markyUtils.getOptionalStringArray({
      value: context.propsValue.publishTo,
      fieldName: 'Platforms',
    });

    const body: PostScheduleRequest = { publish_at: publishAt };
    if (publishTo !== undefined) body.publish_to = publishTo;

    const result = await markyClient.schedulePost({
      apiKey: context.auth.secret_text,
      postId,
      body,
    });

    if (!result.ok) {
      throw new Error(`Failed to schedule post: ${result.message}`);
    }

    return result.data;
  },
});

export { schedulePostAction };
