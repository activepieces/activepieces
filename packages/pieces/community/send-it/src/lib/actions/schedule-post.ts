import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendItAuth } from '../../index';
import {
  platformProperty,
  textProperty,
  mediaUrlProperty,
  scheduledTimeProperty,
  sendItRequest,
} from '../common';

export const schedulePost = createAction({
  auth: sendItAuth,
  name: 'schedule_post',
  displayName: 'Schedule Post',
  description: 'Schedule content to be published at a future time',
  props: {
    platforms: platformProperty,
    text: textProperty,
    mediaUrl: mediaUrlProperty,
    scheduledTime: scheduledTimeProperty,
  },
  async run(context) {
    const { platforms, text, mediaUrl, scheduledTime } = context.propsValue;

    return await sendItRequest(
      context.auth,
      HttpMethod.POST,
      '/schedule',
      {
        platforms,
        content: {
          text,
          mediaUrl,
        },
        scheduledTime,
      }
    );
  },
});
