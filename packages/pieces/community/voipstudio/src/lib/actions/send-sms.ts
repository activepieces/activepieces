import { createAction, Property } from '@activepieces/pieces-framework';
import { voipstudioAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const sendSms = createAction({
  auth: voipstudioAuth,
  name: 'sendSms',
  displayName: 'Send SMS',
  description: 'Send new SMS resource',
  audience: 'both',
  aiMetadata: {
    description:
      'Sends an SMS text message to a destination number in E.164 format; the destination and message text are required, while the sender number is optional. Use this for outbound text notifications. Not idempotent: each call sends a new message.',
    idempotent: false,
  },
  props: {
    from: Property.ShortText({
      displayName: 'From',
      description: 'From number in e164 format',
      required: false,
    }),
    to: Property.ShortText({
      displayName: 'To',
      description: 'Destination number in e164 format',
      required: true,
    }),
    message: Property.ShortText({
      displayName: 'Message',
      description: 'Message to send',
      required: true,
    }),
  },
  async run(context) {
    const { from, to, message } = context.propsValue;

    const body: any = {
      to,
      message,
    };

    if (from !== undefined) body.from = from;

    return await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/sms',
      body
    );
  },
});
