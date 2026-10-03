import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callPlivoApi, plivoCommon } from '../common';
import { plivoAuth } from '../..';

export const plivoSendSms = createAction({
  auth: plivoAuth,
  name: 'send_sms',
  description: 'Send a new SMS message',
  audience: 'both',
  aiMetadata: { description: 'Sends an SMS text message from a Plivo number to a recipient. Use to notify or message a person by text. Requires the destination number, message body, and a sender, which is a Plivo-owned number or an alphanumeric sender ID where the destination country allows one; sending costs money and delivers a separate message on every call, so it is not idempotent.', idempotent: false },
  displayName: 'Send SMS',
  props: {
    from: plivoCommon.sms_phone_number,
    sender_id: Property.ShortText({
      displayName: 'Sender ID',
      description:
        'Sends from this alphanumeric sender ID, short code, or Powerpack UUID instead of the number above. Leave empty to send from the selected number.',
      required: false,
    }),
    body: Property.ShortText({
      displayName: 'Message Body',
      description: 'The body of the message to send',
      required: true,
    }),
    to: Property.ShortText({
      displayName: 'To',
      description: 'The phone number to send the message to, in E.164 format (e.g., +15558675310).',
      required: true,
    }),
  },
  async run(context) {
    const { body, to, from, sender_id } = context.propsValue;
    const src = sender_id?.trim() ? sender_id.trim() : from;
    const auth_id = context.auth.username;
    const auth_token = context.auth.password;
    const response = await callPlivoApi(
      HttpMethod.POST,
      'Message/',
      { auth_id, auth_token },
      {
        src,
        dst: to,
        text: body,
      }
    );
    return response.body;
  },
});
