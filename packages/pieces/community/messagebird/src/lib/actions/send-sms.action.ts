import { messageBirdAuth } from '@activepieces/piece-messagebird';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';

export const sendSMSAction = createAction({
  auth: messageBirdAuth,
  name: 'send-sms',
  displayName: 'Send SMS',
  description: 'Sends an SMS message via MessageBird.',
  props: {
    originator: Property.ShortText({
      displayName: 'Originator',
      description:
        "Enter the sender details. You can either enter the sender's phone number with country code or name or text that is alphanumeric.",
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'The body of the SMS message.',
      required: true,
    }),
    recipients: Property.Array({
      displayName: 'Recipients',
      description:
        'Enter the recipient number to whom you want to send the message.',
      required: true,
    }),
    datacoding: Property.StaticDropdown({
      displayName: 'Data Coding',
      description:
        'Using unicode will limit the maximum number of characters to 70 instead of 160.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Auto', value: 'auto' },
          { label: 'Plain', value: 'plain' },
          { label: 'Unicode', value: 'unicode' },
        ],
      },
    }),
    gateway: Property.Number({
      displayName: 'Gateway',
      description: 'The SMS route that is used to send the message.',
      required: false,
    }),
    validity: Property.Number({
      displayName: 'Validity',
      description:
        'The amount of seconds that the message is valid. If a message is not delivered within this time, the message will be discarded.',
      required: false,
    }),
  },
  async run(context) {
    const { originator, body, datacoding, gateway, validity } =
      context.propsValue;
    const recipients = context.propsValue.recipients as string[];

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: 'https://rest.messagebird.com/messages',
      headers: {
        Accept: 'application/json',
        Authorization: `AccessKey ${context.auth}`,
      },
      body: {
        originator,
        body,
        recipients,
        datacoding,
        gateway,
        validity,
      },
    };

    return await httpClient.sendRequest(request);
  },
});
