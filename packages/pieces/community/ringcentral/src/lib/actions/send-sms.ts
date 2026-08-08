import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ringcentralAuth } from '../common/auth';
import { ringcentralCommon } from '../common/client';

export const sendSms = createAction({
  auth: ringcentralAuth,
  name: 'send_sms',
  displayName: 'Send SMS',
  description: 'Send an SMS text message from one of your RingCentral numbers.',
  props: {
    from: Property.ShortText({
      displayName: 'From',
      description:
        'A RingCentral phone number with SMS enabled, in E.164 format (e.g. +14155550100).',
      required: true,
    }),
    to: Property.Array({
      displayName: 'To',
      description: 'Recipient phone number(s) in E.164 format (e.g. +14155550123).',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Message',
      description: 'The text content of the SMS message.',
      required: true,
    }),
  },
  async run(context) {
    const { from, to, text } = context.propsValue;

    return await ringcentralCommon.sendRequest({
      auth: context.auth,
      method: HttpMethod.POST,
      resourcePath: '/restapi/v1.0/account/~/extension/~/sms',
      body: {
        from: { phoneNumber: from },
        to: to.map((phoneNumber) => ({ phoneNumber: String(phoneNumber) })),
        text,
      },
    });
  },
});
