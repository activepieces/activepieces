import {
  HttpMethod,
  httpClient,
  HttpRequest,
  propsValidation,
} from '@activepieces/pieces-common';
import { contigAuth } from '../..';
import {
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { z } from 'zod';

export const sendSMS = createAction({
  auth: contigAuth,
  name: 'send_sms',
  displayName: 'Send SMS',
  description: 'Send a text message',
  props: {
    to: Property.ShortText({
      displayName: 'To',
      description:
        "Enter the recipient's phone number in international format with no spaces, following this pattern: [+][Country Code][Subscriber Number]. For example, +12065551234.",
      required: true,
    }),
    message: Property.LongText({
      displayName: 'Content',
      description: 'Message to send',
      required: true,
    }),
  },
  async run(context) {
    await propsValidation.validateZod(context.propsValue, {
      to: z.string().regex(/^\+\d{1,4}\d+$/),
    });

    const { to, message } = context.propsValue;

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: 'https://api.contiguity.co/send/text',
      body: {
        to: to,
        message: message,
      },
      headers: {
        authorization: `Token ${context.auth}`,
        'Content-Type': 'application/json',
      },
    };
    return await httpClient.sendRequest(request);
  },
});
