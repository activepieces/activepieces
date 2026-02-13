import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendItAuth } from '../../index';
import { scheduleIdProperty, sendItRequest } from '../common';

export const triggerScheduledPost = createAction({
  auth: sendItAuth,
  name: 'trigger_scheduled_post',
  displayName: 'Trigger Scheduled Post Now',
  description: 'Immediately publish a scheduled post',
  props: {
    scheduleId: scheduleIdProperty,
  },
  async run(context) {
    const { scheduleId } = context.propsValue;

    return await sendItRequest(
      context.auth,
      HttpMethod.POST,
      `/scheduled/${scheduleId}/trigger`
    );
  },
});
