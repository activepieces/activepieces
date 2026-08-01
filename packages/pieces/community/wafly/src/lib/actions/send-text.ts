import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { waflyAuth, waflyApiCall, normalizePhone } from '../common';

export const sendText = createAction({
  auth: waflyAuth,
  name: 'send_text',
  displayName: 'Send Text Message',
  description: 'Send a WhatsApp text message to a phone number or group.',
  audience: 'both',
  aiMetadata: {
    description:
      'Sends a WhatsApp text message from a connected Wafly instance to a single recipient, which can be a phone number in international format or a group ID. Requires the recipient and the message body. Not idempotent: each call delivers a new message, so repeating it sends duplicates.',
    idempotent: false,
  },
  props: {
    phone: Property.ShortText({
      displayName: 'To',
      description:
        'Phone number in international format (e.g. 5511999999999) or a group ID.',
      required: true,
    }),
    message: Property.LongText({
      displayName: 'Message',
      required: true,
    }),
  },
  async run(context) {
    const { phone, message } = context.propsValue;
    return await waflyApiCall({
      auth: context.auth,
      method: HttpMethod.POST,
      resourceUri: '/send-text',
      body: { phone: normalizePhone(phone), message },
    });
  },
});
