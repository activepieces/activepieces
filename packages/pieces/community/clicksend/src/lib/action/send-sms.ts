import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callClickSendApi, clicksendCommon } from '../common';
import { clicksendAuth } from '../..';

export const clicksendSendSms = createAction({
  auth: clicksendAuth,
  name: 'send_sms',
  description: 'Send a new SMS message',
  displayName: 'Send SMS',
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
    schedule: Property.Number({
      description: 'Schedule the message to be sent at a specific timestamp (Unix timestamp)',
      displayName: 'Schedule (Unix Timestamp)',
      required: false,
    }),
  },
  async run(context) {
    const { body, to, from, schedule } = context.propsValue;
    const username = context.auth.username;
    const password = context.auth.password;
    
    const messageData = {
      messages: [
        {
          source: from,
          body: body,
          to: to,
          ...(schedule && { schedule: schedule }),
        },
      ],
    };

    return await callClickSendApi(
      HttpMethod.POST,
      'sms/send',
      { username, password },
      messageData
    );
  },
}); 