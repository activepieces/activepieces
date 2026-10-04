import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callTwilioApi, twilioCommon } from '../common';
import { twilioAuth } from '../..';

export const twilioSendSms = createAction({
  auth: twilioAuth,
  name: 'send_sms',
  classification: 'WRITE',
  description: 'Send an SMS from one of your Twilio numbers.',
  audience: 'both',
  aiMetadata: { description: 'Sends an SMS text message from a Twilio phone number to a recipient. Use to notify or message a person by text. Requires the destination number, message body, and a Twilio-owned sender number; sending costs money and delivers a separate message on every call, so it is not idempotent.', idempotent: false },
  displayName: 'Send SMS',
  props: {
    from: twilioCommon.phoneNumberDropdown({
      displayName: 'From',
      description: 'Your Twilio number the text is sent from.',
    }),
    to: Property.ShortText({
      description: 'Phone number with country code, starting with +.',
      displayName: 'To',
      required: true,
      placeholder: '+15558675310',
    }),
    body: Property.ShortText({
      description: 'Up to 1,600 characters. Long texts are split and billed per part.',
      displayName: 'Message',
      required: true,
      placeholder: 'Your order has shipped!',
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
