import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendItAuth } from '../auth';
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
  audience: 'both',
  aiMetadata: {
    description:
      'Queues a post (text plus optional media URL) to be published at a specified future time on one or more connected social platforms. Choose this when publishing should be deferred; use Publish Post to send immediately. The scheduled time must be in the future and is interpreted in UTC. Not idempotent: each call creates a new scheduled post.',
    idempotent: false,
  },
  props: {
    platforms: platformProperty,
    text: textProperty,
    mediaUrl: mediaUrlProperty,
    scheduledTime: scheduledTimeProperty,
  },
  async run(context) {
    const { platforms, text, mediaUrl, scheduledTime } = context.propsValue;

    return await sendItRequest(
      context.auth.secret_text,
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
