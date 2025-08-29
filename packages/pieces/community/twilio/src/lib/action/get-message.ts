import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callTwilioApi } from '../common';
import { twilioAuth } from '../..';

export const twilioGetMessage = createAction({
  auth: twilioAuth,
  name: 'get_message',
  description: 'Return details of a message with optional media and feedback information',
  displayName: 'Get Message',
  props: {
    message_sid: Property.ShortText({
      description: 'The unique identifier of the message to retrieve',
      displayName: 'Message SID',
      required: true,
    }),
    include_media: Property.Checkbox({
      description: 'Include media files associated with the message',
      displayName: 'Include Media',
      required: false,
      defaultValue: false,
    }),
    include_feedback: Property.Checkbox({
      description: 'Include delivery feedback information',
      displayName: 'Include Feedback',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { message_sid, include_media = false, include_feedback = false } = context.propsValue;
    const account_sid = context.auth.username;
    const auth_token = context.auth.password;

    const messageResponse = await callTwilioApi(
      HttpMethod.GET,
      `Messages/${message_sid}.json`,
      { account_sid, auth_token }
    );

    const messageData = messageResponse.body as any;
    const result: any = {
      message: messageData,
      media: null,
      feedback: null,
    };

    if (include_media && messageData.num_media && parseInt(messageData.num_media) > 0) {
      try {
        const mediaResponse = await callTwilioApi(
          HttpMethod.GET,
          `Messages/${message_sid}/Media.json`,
          { account_sid, auth_token }
        );
        result.media = mediaResponse.body;
      } catch (error) {
        result.media = { error: 'Failed to retrieve media', details: error };
      }
    }

    if (include_feedback) {
      try {
        const feedbackResponse = await callTwilioApi(
          HttpMethod.GET,
          `Messages/${message_sid}/Feedback.json`,
          { account_sid, auth_token }
        );
        result.feedback = feedbackResponse.body;
      } catch (error) {
        result.feedback = { error: 'Failed to retrieve feedback', details: error };
      }
    }

    result.status_info = {
      status: messageData.status,
      is_delivered: ['delivered', 'read'].includes(messageData.status),
      is_failed: ['failed', 'undelivered'].includes(messageData.status),
      has_error: !!messageData.error_code,
      has_media: messageData.num_media && parseInt(messageData.num_media) > 0,
    };

    return result;
  },
});
