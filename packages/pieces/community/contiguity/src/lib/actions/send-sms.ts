import {
  HttpMethod,
  httpClient,
  HttpRequest,
} from '@activepieces/pieces-common';
import { contigAuth } from '../..';
import {
  Property,
  Validators,
  createAction,
} from '@activepieces/pieces-framework';

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
      validators: [Validators.pattern(/^\+\d{1,4}\d+$/)],
    }),
    message: Property.LongText({
      displayName: 'Content',
      description: 'Message to send',
      required: true,
    }),
  },
  async run(context) {
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
