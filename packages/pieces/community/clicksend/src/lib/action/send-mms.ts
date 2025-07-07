import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callClickSendApi, clicksendCommon } from '../common';
import { clicksendAuth } from '../..';

export const clicksendSendMms = createAction({
  auth: clicksendAuth,
  name: 'send_mms',
  description: 'Send a new MMS message with media',
  displayName: 'Send MMS',
  props: {
    to: clicksendCommon.phone_number,
    body: Property.ShortText({
      description: 'The body of the message to send',
      displayName: 'Message Body',
      required: true,
    }),
    from: Property.ShortText({
      description: 'The sender name or number (must be approved in ClickSend)',
      displayName: 'From',
      required: true,
    }),
    media_url: Property.ShortText({
      description: 'The URL of the media file to send (image, video, etc.)',
      displayName: 'Media URL',
      required: true,
    }),
    schedule: Property.Number({
      description: 'Schedule the message to be sent at a specific timestamp (Unix timestamp)',
      displayName: 'Schedule (Unix Timestamp)',
      required: false,
    }),
  },
  async run(context) {
    const { body, to, from, media_url, schedule } = context.propsValue;
    const username = context.auth.username;
    const password = context.auth.password;
    
    const messageData = {
      messages: [
        {
          source: from,
          body: body,
          to: to,
          media_url: media_url,
          ...(schedule && { schedule: schedule }),
        },
      ],
    };

    return await callClickSendApi(
      HttpMethod.POST,
      'mms/send',
      { username, password },
      messageData
    );
  },
}); 