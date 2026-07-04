import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callClickSendApi, clicksendCommon } from '../common';
import { clicksendAuth } from '../..';

export const clicksendSendMms = createAction({
  auth: clicksendAuth,
  name: 'send_mms',
  description: 'Send one or more MMS messages.',
  audience: 'both',
  aiMetadata: {
    description:
      'Sends an MMS multimedia message via ClickSend to a recipient phone number, attaching a media file referenced by URL along with a subject and body. Choose this over Send SMS when the message must include an image, video, or other media. Requires a publicly reachable media URL; not idempotent, as each call dispatches the message again.',
    idempotent: false,
  },
  displayName: 'Send MMS',
  props: {
    to: Property.ShortText({
      description: 'The phone number (with country code, e.g., +1234567890)',
      displayName: 'To',
      required: true,
    }),
    body: Property.ShortText({
      description: 'The body of the message to send',
      displayName: 'Message Body',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      required: true,
    }),
    from: clicksendCommon.sender_id,
    media_url: Property.ShortText({
      description: 'The URL of the media file to send (image, video, etc.)',
      displayName: 'Media URL',
      required: true,
    }),
  },
  async run(context) {
    const {
      to,
      body,
      from,
      media_url,
      subject,
    } = context.propsValue;

    const username = context.auth.username;
    const password = context.auth.password;

    // Validate each message

    if (!to || !body || !media_url) {
      throw new Error(
        'Each message must have a recipient (to), body, and media_url.'
      );
    }

    try {
      const response = await callClickSendApi({
        method: HttpMethod.POST,
        path: '/mms/send',
        username,
        password,
        body: {
          media_file:media_url,
          messages:[{
            subject,
            from,
            body,
            to}
          ]
        },
      });
      return response.body;
    } catch (error: any) {
      // Handle ClickSend API errors and provide meaningful feedback
      if (error?.response?.body?.response_msg) {
        throw new Error(
          `ClickSend API error: ${error.response.body.response_msg}`
        );
      }
      throw error;
    }
  },
});

