import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callPlivoApi, plivoCommon } from '../common';
import { plivoAuth } from '../..';

export const plivoSendSms = createAction({
  auth: plivoAuth,
  name: 'send_sms',
  description: 'Send a new SMS message',
  audience: 'both',
  aiMetadata: { description: 'Sends an SMS text message from a Plivo number to a recipient. Use to notify or message a person by text. Requires the destination number, message body, and a Plivo-owned sender number; sending costs money and delivers a separate message on every call, so it is not idempotent.', idempotent: false },
  displayName: 'Send SMS',
  props: {
    from: plivoCommon.phone_number,
    body: Property.ShortText({
      description: 'The body of the message to send',
      displayName: 'Message Body',
      required: true,
    }),
    to: Property.ShortText({
      description: 'The phone number to send the message to, in E.164 format (e.g., +15558675310).',
      displayName: 'To',
      required: true,
    }),
  },
  async run(context) {
    const { body, to, from } = context.propsValue;
    const auth_id = context.auth.username;
    const auth_token = context.auth.password;
    const response = await callPlivoApi(
      HttpMethod.POST,
      'Message/',
      { auth_id, auth_token },
      {
        src: from,
        dst: to,
        text: body,
      }
    );
    return response.body;
  },
});
