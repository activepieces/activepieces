import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { facebookPagesAuth } from '../../auth';
import { facebookPagesCommon } from '../../common/common';
import { reschedulePostOutputSchema } from '../../output-schemas';

export const reschedulePostAction = createAction({
  auth: facebookPagesAuth,
  name: 'reschedule_post',
  classification: 'WRITE',
  displayName: 'Reschedule Post',
  description: 'Changes when a scheduled Facebook Page post will be published.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Move a scheduled, not yet published Facebook Page post to a new publish time at least 10 minutes ahead. Find scheduled posts with Get Scheduled Posts; use Publish Scheduled Post to publish now instead. Facebook only allows this on posts created through this same app.',
    idempotent: true,
  },
  outputSchema: reschedulePostOutputSchema,
  props: {
    pageId: facebookPagesCommon.pageId,
    postId: facebookPagesCommon.postId,
    scheduledPublishTime: Property.DateTime({
      displayName: 'Scheduled Publish Time',
      description: 'ISO 8601 date and time to publish the post, at least 10 minutes from now.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const scheduledPublishTime = facebookPagesCommon.toScheduledUnixTime({ value: propsValue.scheduledPublishTime });
    const response = await facebookPagesCommon.pageRequest<{ success: boolean }>({
      auth,
      pageId: propsValue.pageId,
      method: HttpMethod.POST,
      path: facebookPagesCommon.objectPath({ id: propsValue.postId }),
      body: { scheduled_publish_time: scheduledPublishTime },
    });
    return {
      success: response.success,
      post_id: propsValue.postId.trim(),
      scheduled_publish_time: new Date(scheduledPublishTime * 1000).toISOString(),
    };
  },
});
