import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { telnyxAuth } from '../auth';
import { telnyxRequest } from '../common/client';

export const sendSmsAction = createAction({
  auth: telnyxAuth,
  name: 'send_sms',
  displayName: 'Send SMS',
  description: 'Send an SMS message using the Telnyx Messages API.',
  props: {
    from: Property.ShortText({
      displayName: 'From',
      description: 'The sending number or sender ID.',
      required: true,
    }),
    to: Property.ShortText({
      displayName: 'To',
      description: 'The destination phone number in E.164 format.',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'The message body to send.',
      required: true,
    }),
    messaging_profile_id: Property.ShortText({
      displayName: 'Messaging Profile ID',
      description: 'Optional Telnyx messaging profile ID.',
      required: false,
    }),
  },
  async run(context) {
    const { from, to, text, messaging_profile_id } = context.propsValue;

    return await telnyxRequest({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/messages',
      body: {
        from,
        to,
        text,
        ...(messaging_profile_id ? { messaging_profile_id } : {}),
      },
    });
  },
});
