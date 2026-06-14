import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendItAuth } from '../auth';
import { scheduleIdProperty, sendItRequest } from '../common';

export const cancelScheduledPost = createAction({
  auth: sendItAuth,
  name: 'cancel_scheduled_post',
  displayName: 'Cancel Scheduled Post',
  description: 'Cancel a scheduled post before it is published',
  audience: 'both',
  aiMetadata: {
    description:
      'Cancels a pending scheduled post by its schedule ID so it will not be published. Use this to call off a future post created by Schedule Post; only posts in Pending status can be cancelled. Idempotent: cancelling an already-cancelled or non-existent schedule leaves it in the same cancelled end state.',
    idempotent: true,
  },
  props: {
    scheduleId: scheduleIdProperty,
  },
  async run(context) {
    const { scheduleId } = context.propsValue;

    return await sendItRequest(
      context.auth.secret_text,
      HttpMethod.DELETE,
      `/scheduled/${scheduleId}`
    );
  },
});
