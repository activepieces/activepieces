import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callTwilioApi, twilioCommon } from '../common';
import { twilioAuth } from '../..';

export const twilioSendSms = createAction({
  auth: twilioAuth,
  name: 'send_sms',
  description: 'Send a new SMS message',
  audience: 'both',
  aiMetadata: { description: 'Sends an SMS text message from a Twilio phone number to a recipient. Use to notify or message a person by text. Requires the destination number, message body, and a Twilio-owned sender number; sending costs money and delivers a separate message on every call, so it is not idempotent.', idempotent: false },
  displayName: 'Send SMS',
  props: {
    from: twilioCommon.phone_number,
    body: Property.ShortText({
      description: 'The body of the message to send',
      displayName: 'Message Body',
      required: true,
    }),
    to: Property.ShortText({
      description: 'The phone number to send the message to',
      displayName: 'To',
      required: true,
    }),
  },
  async run(context) {
    const { body, to, from } = context.propsValue;
    const account_sid = context.auth.username;
    const auth_token = context.auth.password;
    return await callTwilioApi(
      HttpMethod.POST,
      'Messages.json',
      { account_sid, auth_token },
      {
        From: from,
        Body: body,
        To: to,
      }
    );
  },
});
