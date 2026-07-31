import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { ringcentralAuth } from '../common/auth';
import { ringcentralApiCall } from '../common/client';
import { smsFromNumberDropdown } from '../common/props';

export const sendSms = createAction({
  auth: ringcentralAuth,
  name: 'send_sms',
  displayName: 'Send SMS',
  description: 'Send an SMS text message from one of your RingCentral phone numbers',
  props: {
    from: smsFromNumberDropdown,
    to: Property.ShortText({
      displayName: 'To',
      description: 'The recipient phone number, in E.164 format (e.g. +16505551234)',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Message',
      required: true,
    }),
  },
  async run(context) {
    const { from, to, text } = context.propsValue;

    return ringcentralApiCall({
      auth: context.auth,
      method: HttpMethod.POST,
      resourceUri: '/restapi/v1.0/account/~/extension/~/sms',
      body: {
        from: { phoneNumber: from },
        to: [{ phoneNumber: to }],
        text,
      },
    });
  },
});
