import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendItAuth } from '../../index';
import { scheduleIdProperty, sendItRequest } from '../common';

export const cancelScheduledPost = createAction({
  auth: sendItAuth,
  name: 'cancel_scheduled_post',
  displayName: 'Cancel Scheduled Post',
  description: 'Cancel a scheduled post before it is published',
  props: {
    scheduleId: scheduleIdProperty,
  },
  async run(context) {
    const { scheduleId } = context.propsValue;

    return await sendItRequest(
      context.auth,
      HttpMethod.DELETE,
      `/scheduled/${scheduleId}`
    );
  },
});
