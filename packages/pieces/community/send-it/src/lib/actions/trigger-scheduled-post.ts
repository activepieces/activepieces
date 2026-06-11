import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendItAuth } from '../auth';
import { scheduleIdProperty, sendItRequest } from '../common';

export const triggerScheduledPost = createAction({
  auth: sendItAuth,
  name: 'trigger_scheduled_post',
  displayName: 'Trigger Scheduled Post Now',
  description: 'Immediately publish a scheduled post',
  audience: 'both',
  aiMetadata: {
    description:
      'Publishes a pending scheduled post right away instead of waiting for its scheduled time, identified by its schedule ID. Use this to push out a queued post early. Not idempotent: it performs an actual publish, so repeating the call can re-publish the content.',
    idempotent: false,
  },
  props: {
    scheduleId: scheduleIdProperty,
  },
  async run(context) {
    const { scheduleId } = context.propsValue;

    return await sendItRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      `/scheduled/${scheduleId}/trigger`
    );
  },
});
