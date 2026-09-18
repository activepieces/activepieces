import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { markyAuth } from '../auth';
import { markyCommon } from '../common/client';
import { markyProps } from '../common/props';

export const schedulePostAction = createAction({
  auth: markyAuth,
  name: 'schedule_post',
  displayName: 'Schedule Post',
  description: 'Schedule an existing post for publishing at a specific time.',
  audience: 'both',
  aiMetadata: {
    description:
      'Set the publish time of a Marky post that is still New or Scheduled, optionally restricting which platforms it goes to. This is the only way to set a publish time, and the only place a repeating cron can be set. Re-scheduling the same post to the same time is safe to retry.',
    idempotent: true,
  },
  props: {
    businessId: markyProps.businessId,
    postId: Property.ShortText({
      displayName: 'Post ID',
      description:
        'The ID of the post to schedule, as returned by Create Post or List Posts. The post must still be New or Scheduled.',
      required: true,
    }),
    scheduledPublishTime: Property.DateTime({
      displayName: 'Publish At',
      description: 'When to publish the post. Must be in the future.',
      required: true,
    }),
    restrictPublishTo: markyProps.restrictPublishTo,
    repeatingCron: Property.ShortText({
      displayName: 'Repeat (cron)',
      description:
        "Make the post recurring with a 5-field cron expression, e.g. '0 9 * * 1' for every Monday at 9am UTC. Leave empty for a one-off post.",
      required: false,
    }),
  },
  async run(context) {
    const { businessId, postId, scheduledPublishTime, restrictPublishTo, repeatingCron } =
      context.propsValue;

    const response = await markyCommon.apiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/businesses/${businessId}/posts/${postId}/schedule`,
      body: {
        scheduled_publish_time: scheduledPublishTime,
        ...(restrictPublishTo && restrictPublishTo.length > 0
          ? { restrict_publish_to: restrictPublishTo }
          : {}),
        ...(repeatingCron ? { repeating_cron: repeatingCron } : {}),
      },
    });

    return response.body;
  },
});
